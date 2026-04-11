import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import recommend


class RecommenderTest(unittest.TestCase):

    def test_recommend_returns_strong_match(self):
        payload = {
            "user": {
                "education": {
                    "level": "UNDERGRADUATE",
                    "fieldOfStudy": "cs",
                    "currentGPA": 9.1
                },
                "preferences": {
                    "targetCountries": ["USA"],
                    "fundingTypes": ["FULL_FUNDING"],
                    "fieldsOfStudy": ["computer science"]
                }
            },
            "scholarships": [
                {
                    "id": "s1",
                    "name": "US Computer Science Scholarship",
                    "country": "US",
                    "degreeLevel": "UNDERGRADUATE",
                    "fieldOfStudy": "computer science",
                    "fundingType": "FULL_FUNDING",
                    "deadline": "2026-12-01T00:00:00Z",
                    "tags": ["computer-science"]
                }
            ],
            "acceptedScholarships": [],
            "limit": 5
        }

        response = recommend(payload)
        self.assertEqual(len(response["recommendations"]), 1)
        self.assertEqual(response["recommendations"][0]["scholarshipId"], "s1")
        self.assertGreaterEqual(response["recommendations"][0]["score"], 75)


if __name__ == "__main__":
    unittest.main()
