import json
from itertools import product
import ssl
from urllib import parse, request

QUIRKS = (
    "Austere",
    "Daring",
    "Hedonist",
    "Magnanimous",
    "Melancholy",
    "Ruthless",
    "Steadfast",
    "Subtle",
    "Heartless",
    "Forceful",
)
CATEGORIES = ("Gains", "Loses")

if __name__ == "__main__":
    gains = {}
    loses = {}
    ids_to_titles = {}

    for category, quirk in product(CATEGORIES, QUIRKS):
        print(f"Dumping data for {category}:{quirk}")

        data = parse.urlencode(
            {
                "action": "ask",
                "format": "json",
                "query": f"[[{category}::{quirk}]]|?ID|limit=7777",
            }
        ).encode()

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = request.Request("https://fallenlondon.wiki/w/api.php", data=data)
        with request.urlopen(req, context=ctx) as response:
            result = json.loads(response.read())

        for title, entry in result["query"]["results"].items():
            for branch_id in entry["printouts"]["ID"]:
                ids_to_titles[branch_id] = title

                destination = gains if category == "Gains" else loses
                quirk_changes = destination.setdefault(branch_id, [])
                if quirk not in quirk_changes:
                    quirk_changes.append(quirk)

    with open("quirk_changes.js", "w") as fp:
        fp.write(
            """
// This information was compiled using data submitted to the "Fallen London Wiki"
// (https://fallenlondon.wiki) by its contributors and is used here under
// CC-BY-SA 3.0 license (https://creativecommons.org/licenses/by-sa/3.0/)

"""
        )

        fp.write("QUIRK_CHANGES = {\n")
        fp.write('    "Gains": {\n')
        for branch_id, quirks in sorted(gains.items(), key=lambda it: it[0]):
            serialized_quirks = ", ".join(['"' + quirk + '"' for quirk in quirks])
            fp.write(f"        // {ids_to_titles[branch_id]}\n")
            fp.write(f'        "id_{branch_id}": [{serialized_quirks}],\n')
        fp.write("    },\n")

        fp.write('    "Loses": {\n')
        for branch_id, quirks in sorted(loses.items(), key=lambda it: it[0]):
            serialized_quirks = ", ".join(['"' + quirk + '"' for quirk in quirks])
            fp.write(f"        // {ids_to_titles[branch_id]}\n")
            fp.write(f'        "id_{branch_id}": [{serialized_quirks}],\n')
        fp.write("    }\n")
        fp.write("}\n")

    with open("quirk_changes.json", "w") as fp:
        json.dump(
            {
                "Gains": gains,
                "Loses": loses,
                "__meta__": {
                    "disclaimer": "This information was compiled using data submitted to the 'Fallen London Wiki'"
                    " (https://fallenlondon.wiki) by its contributors and is used here under CC-BY-SA 3.0 license "
                    "(https://creativecommons.org/licenses/by-sa/3.0/)"
                }
            },
            fp,
            indent=4,
        )
