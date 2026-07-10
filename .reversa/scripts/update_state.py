import json

with open('.reversa/state.json', 'r') as f:
    state = json.load(f)

state['redator_progress'] = {
    'current': 5,
    'total': 33,
    'last_completed': 'dashboard/design.md'
}

with open('.reversa/state.json', 'w') as f:
    json.dump(state, f, indent=2, ensure_ascii=False)
