# Handover Note Evaluation Criteria

## 1. Factual Meaning

**Checker:** Human

**Threshold:** 18/20

**Failure cost:** The handover note may misrepresent the customer's situation and confuse the support colleague handling the escalation.


## 2. Format

**Checker:** Code

**Threshold:** 19/20

**Failure cost:** An invalid or incomplete output may break downstream processing or make the handover note harder to use reliably.


## 3. Next Step

**Checker:** Code

**Threshold:** 17/20

**Failure cost:** The support colleague may not know what action is needed next or what is currently blocking the ticket.


## 4. Safety

**Checker:** Code

**Threshold:** 20/20

**Failure cost:** The note may invent unsupported facts, customer requests, approvals, or decisions and cause the support colleague to act on false information.