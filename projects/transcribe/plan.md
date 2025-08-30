We'll be working in the transcribe folder.

We're going to build a pipeline that takes a stream of audio from the user, and transcribes this and turns it into discrete tool calls.

# Overall app

We want to setup real-time whiteboarding with LLMs. The user will speak some text like "Draw me a database, then draw me a person. Draw an arrow to connect the database to the person".

The transcription layer should turn this speech into a series of tool calls:
```
db_uuid = draw_item(DATABASE)
person_uuid = draw_item(PERSON)
connect(db_uuid, person_uuid)
```

Again, this should be real time. As the user says:

```
Draw me a database, [...]
```

The tool call to generate the database item should be issued immediately. So we need some way of realising a single coherent unit of sketch has been requested, after which a tool call should be issued, while further text is being issued.

Architecturally, we want to use the OpenAI Agents SDK: https://openai.github.io/openai-agents-python/

OpenAI Agents SDK supports special voice pipelines. See: https://openai.github.io/openai-agents-python/voice/quickstart/, https://openai.github.io/openai-agents-python/voice/pipeline/ and 

# List of tools

- `draw_item(item_type: ENUM) -> uuid`: draws an item. The item types are an enum, only a subset of items are legal to draw. Returns a UUID for the item for later referencing.
- `connect(item1, item2)`: draw an arrow between item1 and item2
- `delete_item(item_uuid)`: delete an item, identified by UUID

item_type: enum. Possible values: `database, person`