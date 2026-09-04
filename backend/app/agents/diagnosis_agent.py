import json
import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.models import Incident, IncidentStatus, AgentAction
from backend.app.schemas.incidents import DiagnosisOutputSchema
from backend.app.utils.config import settings


DIAGNOSIS_PROMPT_TEMPLATE = """
You are PayFixor Diagnosis Agent, a specialized fintech AI reasoning system.
Your role is to diagnose payment degradation patterns based ONLY on the provided deterministic evidence bundle.

CRITICAL INSTRUCTIONS:
1. AI reasons. Deterministic code controls.
2. You must clearly distinguish between OBSERVED EVIDENCE and HYPOTHESIS.
   - Example Observed: "UPI failures for Bank_X increased from 5.1% to 20.4% while other banks remained at ~5%."
   - Example Hypothesis: "Bank_X UPI acquiring/switch service degradation is a plausible root cause."
3. Do NOT invent external facts (e.g. do not claim "Bank X datacenter is on fire" or "RBI issued a circular" unless supported by evidence).
4. If evidence is ambiguous, contradictory, or sample size too low, state so in unknowns and set confidence accordingly.
5. Provide recommended_recovery_strategy from:
   - "ALTERNATIVE_PAYMENT_METHOD" (if isolated to a specific bank/method)
   - "RETRY_RECOMMENDATION" (if transient or general timeout)
   - "RAZORPAY_PAYMENT_LINK" (if direct link with alternative options is ideal)

Evidence Bundle:
{evidence_json}

You MUST output ONLY a valid JSON object matching this schema:
{{
  "hypothesis": "Clear explanation of the suspected root-cause degradation",
  "confidence": 0.91,
  "supporting_evidence": ["Fact 1 from data", "Fact 2 from data"],
  "unknowns": ["Item 1 not proven by data", "Item 2 needing monitoring"],
  "recommended_recovery_strategy": "ALTERNATIVE_PAYMENT_METHOD"
}}
"""


class DiagnosisAgent:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _call_gemini_api(self, evidence_json_str: str) -> Optional[DiagnosisOutputSchema]:
        if not settings.GEMINI_API_KEY:
            return None
            
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = DIAGNOSIS_PROMPT_TEMPLATE.format(evidence_json=evidence_json_str)
            
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            
            raw_text = response.text
            parsed = json.loads(raw_text)
            return DiagnosisOutputSchema(**parsed)
        except Exception as e:
            return None

    def _fallback_deterministic_diagnosis(self, evidence: Dict[str, Any]) -> DiagnosisOutputSchema:
        """
        Deterministic evidence-based hypothesis generator when Gemini API is offline or unconfigured.
        """
        bank = evidence.get("bank", "Bank")
        method = evidence.get("payment_method", "Payment")
        current_rate = evidence.get("current_failure_rate", 0.0)
        baseline_rate = evidence.get("baseline_failure_rate", 0.05)
        anomaly_ratio = evidence.get("anomaly_ratio", 1.0)
        bank_comp = evidence.get("bank_comparison", {})
        
        other_banks_rates = [rate for b, rate in bank_comp.items() if b != bank]
        other_avg = (sum(other_banks_rates) / len(other_banks_rates)) if other_banks_rates else baseline_rate

        supporting_evidence = [
            f"{method} failures for {bank} spiked to {current_rate*100:.1f}% (baseline: {baseline_rate*100:.1f}%, anomaly: {anomaly_ratio:.1f}x).",
        ]
        
        if other_banks_rates:
            supporting_evidence.append(
                f"Peer banks for {method} maintained normal failure rates averaging {other_avg*100:.1f}%."
            )

        if anomaly_ratio >= 2.5:
            confidence = min(0.95, 0.75 + (anomaly_ratio * 0.05))
            hypothesis = (
                f"Systemic degradation localized to {bank}'s {method} processing gateway. "
                f"Peer institutions show nominal failure rates ({other_avg*100:.1f}%), indicating an issuer/acquiring endpoint issue at {bank}."
            )
            recommended_strategy = "ALTERNATIVE_PAYMENT_METHOD"
            unknowns = [
                f"Underlying technical reason within {bank}'s internal infrastructure",
                "Expected time to full resolution by the issuer bank"
            ]
        else:
            confidence = 0.80
            hypothesis = f"Moderate elevation in {method} failures for {bank}. Evidence of systemic degradation is present but requires continuous monitoring."
            recommended_strategy = "RETRY_RECOMMENDATION"
            unknowns = [
                "Whether failure rate will stabilize or escalate",
                "Transient network packet loss vs bank switch overload"
            ]

        return DiagnosisOutputSchema(
            hypothesis=hypothesis,
            confidence=round(confidence, 2),
            supporting_evidence=supporting_evidence,
            unknowns=unknowns,
            recommended_recovery_strategy=recommended_strategy
        )

    async def diagnose(self, incident: Incident, evidence_bundle: Dict[str, Any]) -> DiagnosisOutputSchema:
        evidence_str = json.dumps(evidence_bundle, indent=2)
        
        diagnosis = await self._call_gemini_api(evidence_str)
        
        if not diagnosis:
            diagnosis = self._fallback_deterministic_diagnosis(evidence_bundle)

        incident.hypothesis = diagnosis.hypothesis
        incident.confidence = diagnosis.confidence
        incident.supporting_evidence = diagnosis.supporting_evidence
        incident.unknowns = diagnosis.unknowns
        incident.recommended_strategy = diagnosis.recommended_recovery_strategy
        
        if diagnosis.confidence < settings.MIN_CONFIDENCE_THRESHOLD:
            incident.status = IncidentStatus.INSUFFICIENT_EVIDENCE
        else:
            incident.status = IncidentStatus.CONFIRMED

        agent_action = AgentAction(
            action_id=f"ACT_{uuid.uuid4().hex[:8].upper()}",
            agent_name="DiagnosisAgent",
            incident_id=incident.incident_id,
            input_json=evidence_bundle,
            output_json=diagnosis.model_dump(),
            confidence=diagnosis.confidence
        )
        self.db.add(agent_action)
        await self.db.commit()

        return diagnosis
