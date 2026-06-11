# Team names are not spoilers; only scores are

In a spoiler-avoidance app one would assume that knockout-bracket team names are hidden too — knowing who advanced implies group results. We deliberately decided the opposite: knockout slots show real team names as soon as the data provides them, and only score/result information (scores, scorers, standings) is gated behind reveal buttons.

This was chosen over per-slot name hiding (and over the "smart" variant that reveals a name only once all feeding matches are revealed, which requires modeling the full bracket dependency graph). The simplification is significant: rendering always uses the freshest fetched data verbatim, and reveal state is a flat per-match set plus a per-group standings gate — no dependency logic anywhere.
