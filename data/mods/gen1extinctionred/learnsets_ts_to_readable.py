import re

INPUT_FILE = "learnsets.ts"

def title_move(move):
    # Split camel-ish words where possible
    words = re.findall(r"[a-z]+", move)
    pretty = []

    for w in words:
        if w == "edge":
            pretty.append("Edge")
        elif w == "slam":
            pretty.append("Slam")
        elif w == "pulse":
            pretty.append("Pulse")
        elif w == "wave":
            pretty.append("Wave")
        elif w == "beam":
            pretty.append("Beam")
        else:
            pretty.append(w.capitalize())

    # Special hyphenated moves
    hyphenated = {
        "Doubleedge": "Double-Edge",
        "Bodyslam": "Body Slam",
        "Doubleteam": "Double Team",
        "Mudslap": "Mud-Slap",
    }

    name = " ".join(pretty)
    return hyphenated.get(name.replace(" ", ""), name)

def title_species(species):
    return species.capitalize()

with open(INPUT_FILE, encoding="utf8") as f:
    data = f.read()

# Match each Pokémon block
blocks = re.findall(
    r"(\w+):\s*{\s*learnset:\s*{([^}]*)}",
    data,
    re.DOTALL,
)

for species, body in blocks:
    moves = re.findall(r"(\w+):\s*\[", body)
    pretty_moves = sorted(title_move(m) for m in moves)

    print(f"{title_species(species)}: {', '.join(pretty_moves)}")