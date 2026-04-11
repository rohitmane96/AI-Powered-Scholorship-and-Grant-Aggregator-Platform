#!/usr/bin/env python3
import json
import math
import os
import re
from collections import Counter
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Dict, List, Tuple


COUNTRY_ALIASES = {
    "usa": "us",
    "u s a": "us",
    "u s": "us",
    "united states": "us",
    "united states of america": "us",
    "america": "us",
    "uk": "uk",
    "u k": "uk",
    "united kingdom": "uk",
    "great britain": "uk",
    "britain": "uk",
    "england": "uk",
    "india": "india",
}

FIELD_ALIASES = {
    "cs": "computer science",
    "cse": "computer science",
    "it": "information technology",
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "ece": "electronics communication engineering",
    "eee": "electrical electronics engineering",
    "entc": "electronics telecommunication engineering",
    "mech": "mechanical engineering",
    "civil": "civil engineering",
}

STOP_WORDS = {
    "and", "the", "for", "with", "from", "into", "that", "this", "are", "you",
    "your", "any", "all", "who", "can", "their", "under", "over", "than", "have",
    "has", "been", "will", "not", "but", "our", "out", "per", "through", "study",
    "scholarship", "scholarships", "student", "students",
}


def normalize_country(value: str) -> str:
    if not value:
        return ""
    value = re.sub(r"[^a-z\s]", " ", value.lower()).strip()
    value = re.sub(r"\s+", " ", value)
    return COUNTRY_ALIASES.get(value, value)


def normalize_field(value: str) -> str:
    if not value:
        return ""
    value = value.lower().replace("&", " ")
    value = re.sub(r"[^a-z\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    tokens = [FIELD_ALIASES.get(token, token) for token in value.split()]
    return " ".join(tokens).strip()


def tokenize(text: str) -> List[str]:
    text = normalize_field(text)
    tokens = [token for token in text.split() if token and token not in STOP_WORDS and len(token) > 1]
    expanded: List[str] = []
    for token in tokens:
        expanded.extend(token.split())
    return expanded


def cosine_similarity(a: Dict[str, float], b: Dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    common = set(a.keys()) & set(b.keys())
    numerator = sum(a[token] * b[token] for token in common)
    norm_a = math.sqrt(sum(value * value for value in a.values()))
    norm_b = math.sqrt(sum(value * value for value in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return numerator / (norm_a * norm_b)


def build_tfidf_vectors(user_text: str, scholarship_texts: List[str]) -> Tuple[Dict[str, float], List[Dict[str, float]]]:
    corpus_tokens = [tokenize(user_text)] + [tokenize(text) for text in scholarship_texts]
    doc_count = len(corpus_tokens)
    doc_freq = Counter()
    for tokens in corpus_tokens:
        doc_freq.update(set(tokens))

    def vectorize(tokens: List[str]) -> Dict[str, float]:
        counts = Counter(tokens)
        total = sum(counts.values()) or 1
        vector: Dict[str, float] = {}
        for token, count in counts.items():
            tf = count / total
            idf = math.log((1 + doc_count) / (1 + doc_freq[token])) + 1
            vector[token] = tf * idf
        return vector

    user_vector = vectorize(corpus_tokens[0])
    scholarship_vectors = [vectorize(tokens) for tokens in corpus_tokens[1:]]
    return user_vector, scholarship_vectors


def field_tokens(values: List[str]) -> List[str]:
    tokens: List[str] = []
    for value in values:
        tokens.extend(tokenize(value))
    return tokens


def overlap_ratio(a_tokens: List[str], b_tokens: List[str]) -> float:
    if not a_tokens or not b_tokens:
        return 0.0
    a_set = set(a_tokens)
    b_set = set(b_tokens)
    union = a_set | b_set
    if not union:
        return 0.0
    return len(a_set & b_set) / len(union)


def parse_deadline(value: str):
    if not value:
        return None
    try:
        if value.endswith("Z"):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def days_until(deadline_value: str) -> int:
    deadline = parse_deadline(deadline_value)
    if not deadline:
        return 0
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return int((deadline - now).total_seconds() // 86400)


def build_user_text(user: dict) -> str:
    education = user.get("education") or {}
    preferences = user.get("preferences") or {}
    parts: List[str] = []
    if education.get("fieldOfStudy"):
        parts.append(normalize_field(education["fieldOfStudy"]))
    if education.get("level"):
        parts.append(education["level"].replace("_", " ").lower())
    for country in preferences.get("targetCountries", []):
        parts.append(normalize_country(country))
    for funding in preferences.get("fundingTypes", []):
        parts.append(str(funding).replace("_", " ").lower())
    for field in preferences.get("fieldsOfStudy", []):
        parts.append(normalize_field(field))
    return " ".join(part for part in parts if part)


def build_scholarship_text(scholarship: dict) -> str:
    parts: List[str] = []
    for key in ("name", "provider", "description", "fieldOfStudy"):
        if scholarship.get(key):
            parts.append(str(scholarship[key]))
    if scholarship.get("country"):
        parts.append(normalize_country(scholarship["country"]))
    if scholarship.get("degreeLevel"):
        parts.append(str(scholarship["degreeLevel"]).replace("_", " ").lower())
    if scholarship.get("fundingType"):
        parts.append(str(scholarship["fundingType"]).replace("_", " ").lower())
    parts.extend(scholarship.get("tags") or [])
    parts.extend(scholarship.get("eligibility") or [])
    return " ".join(str(part) for part in parts if part)


def compute_rule_score(user: dict, scholarship: dict, accepted: List[dict]) -> Tuple[int, Dict[str, int]]:
    breakdown: Dict[str, int] = {}
    education = user.get("education") or {}
    preferences = user.get("preferences") or {}
    user_countries = {normalize_country(country) for country in preferences.get("targetCountries", []) if country}
    scholarship_country = normalize_country(scholarship.get("country", ""))
    if scholarship_country and scholarship_country in user_countries:
        breakdown["country"] = 20

    user_level = education.get("level")
    scholarship_level = scholarship.get("degreeLevel")
    if user_level and scholarship_level and scholarship_level in ("ANY", user_level):
        breakdown["degreeLevel"] = 20

    user_fields = []
    if education.get("fieldOfStudy"):
        user_fields.append(education["fieldOfStudy"])
    user_fields.extend(preferences.get("fieldsOfStudy", []))
    norm_user_fields = [normalize_field(field) for field in user_fields if field]
    scholarship_field = normalize_field(scholarship.get("fieldOfStudy", ""))
    if scholarship_field == "any":
        breakdown["fieldOfStudy"] = 20
    elif scholarship_field and scholarship_field in norm_user_fields:
        breakdown["fieldOfStudy"] = 20
    elif scholarship_field and any(
        scholarship_field in field or field in scholarship_field or overlap_ratio(tokenize(field), tokenize(scholarship_field)) >= 0.2
        for field in norm_user_fields
    ):
        breakdown["fieldOfStudy"] = 10

    gpa = education.get("currentGPA")
    if isinstance(gpa, (int, float)):
        if gpa >= 8.0:
            breakdown["gpa"] = 15
        elif gpa >= 7.0:
            breakdown["gpa"] = 10
        elif gpa >= 6.0:
            breakdown["gpa"] = 5

    user_funding = set(preferences.get("fundingTypes") or [])
    if scholarship.get("fundingType") and scholarship["fundingType"] in user_funding:
        breakdown["fundingType"] = 15

    tag_tokens = field_tokens(scholarship.get("tags") or [])
    user_field_tokens = field_tokens(norm_user_fields)
    if overlap_ratio(user_field_tokens, tag_tokens) >= 0.2:
        breakdown["tagMatch"] = 5

    remaining_days = days_until(scholarship.get("deadline"))
    if 0 < remaining_days <= 30:
        breakdown["deadlineUrgency"] = 5

    for previous in accepted:
        if normalize_country(previous.get("country", "")) == scholarship_country:
            breakdown["historyBoost"] = 10
            break
        previous_field = normalize_field(previous.get("fieldOfStudy", ""))
        if previous_field and scholarship_field and (
            previous_field == scholarship_field
            or previous_field in scholarship_field
            or scholarship_field in previous_field
            or overlap_ratio(tokenize(previous_field), tokenize(scholarship_field)) >= 0.25
        ):
            breakdown["historyBoost"] = 10
            break

    return min(sum(breakdown.values()), 100), breakdown


def recommend(payload: dict) -> dict:
    user = payload.get("user") or {}
    scholarships = payload.get("scholarships") or []
    accepted = payload.get("acceptedScholarships") or []
    limit = max(1, int(payload.get("limit", 10)))

    user_text = build_user_text(user)
    scholarship_texts = [build_scholarship_text(sch) for sch in scholarships]
    user_vector, scholarship_vectors = build_tfidf_vectors(user_text, scholarship_texts)
    max_popularity = max(
        [(sch.get("viewCount", 0) or 0) + 2 * (sch.get("applicationCount", 0) or 0) for sch in scholarships] or [1]
    )

    results = []
    user_field_values = []
    education = user.get("education") or {}
    preferences = user.get("preferences") or {}
    if education.get("fieldOfStudy"):
        user_field_values.append(education["fieldOfStudy"])
    user_field_values.extend(preferences.get("fieldsOfStudy") or [])
    user_field_tokens = field_tokens(user_field_values)

    for scholarship, scholarship_vector in zip(scholarships, scholarship_vectors):
        rule_score, breakdown = compute_rule_score(user, scholarship, accepted)
        tfidf_score = round(cosine_similarity(user_vector, scholarship_vector) * 100)
        semantic_score = round(overlap_ratio(user_field_tokens, field_tokens([scholarship.get("fieldOfStudy", "")])) * 100)
        nlp_score = round((tfidf_score * 0.7) + (semantic_score * 0.3))
        popularity_raw = (scholarship.get("viewCount", 0) or 0) + 2 * (scholarship.get("applicationCount", 0) or 0)
        popularity_score = round((popularity_raw / max_popularity) * 100) if max_popularity else 0
        final_score = round(rule_score * 0.5 + nlp_score * 0.4 + popularity_score * 0.1)

        if rule_score >= 70 and popularity_score == 0:
            final_score = max(final_score, rule_score)
        elif rule_score >= 60 and nlp_score < 35 and popularity_score == 0:
            final_score = max(final_score, min(85, round(rule_score * 0.85)))

        if final_score <= 0:
            continue

        breakdown["nlpSimilarity"] = nlp_score
        breakdown["popularityScore"] = popularity_score
        results.append({
            "scholarshipId": scholarship.get("id"),
            "score": min(final_score, 100),
            "scoreBreakdown": breakdown,
        })

    results.sort(key=lambda item: item["score"], reverse=True)
    return {"recommendations": results[:limit]}


class RecommendationHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, payload: dict):
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"status": "ok"})
            return
        self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/recommend":
            self._send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length)
            payload = json.loads(raw.decode("utf-8"))
            self._send_json(200, recommend(payload))
        except Exception as exc:
            self._send_json(400, {"error": str(exc)})

    def log_message(self, fmt: str, *args):
        return


def main():
    port = int(os.environ.get("PORT", "8090"))
    server = HTTPServer(("0.0.0.0", port), RecommendationHandler)
    print(f"Python recommender listening on {port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
