import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from prompt_architect import search_exemplars, expand_prompt

def main():
    print("=== Test 1: Exemplar Retrieval for 'cyberpunk samurai in rain' ===")
    exemplars = search_exemplars("cyberpunk samurai in rain", k=3)
    for i, ex in enumerate(exemplars):
        print(f"[{i+1}] (Score: {ex['score']:.3f}, Cat: {ex['category']}):\n    {ex['text']}\n")

    print("\n=== Test 2: Full Prompt Architect Expansion via Groq LLM ===")
    res = expand_prompt("a doctor talking to an elderly patient in a sunlit room", style="cinematic")
    print(f"Original: {res['original_prompt']}")
    print(f"\nEnhanced Prompt:\n{res['enhanced_prompt']}")
    print(f"\nLighting: {res['lighting']}")
    print(f"Camera: {res['camera']}")
    print(f"Method: {res['method']}")
    print(f"\nNegative Prompt:\n{res['negative_prompt']}")

if __name__ == "__main__":
    main()
