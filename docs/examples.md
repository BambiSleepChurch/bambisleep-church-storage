# Examples

Real-world usage examples and common patterns for the File Hosting MCP Server.

## Basic Operations

### Uploading a Text File

**User request:**

> "Save my shopping list to a file called shopping.txt"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "shopping.txt",
    "content": "- Milk\n- Eggs\n- Bread\n- Butter",
    "encoding": "utf8"
  }
}
```

**Response:**

```
File "shopping.txt" uploaded successfully to ./storage/shopping.txt
```

---

### Uploading JSON Data

**User request:**

> "Store this configuration as config.json"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "config.json",
    "content": "{\n  \"theme\": \"dark\",\n  \"language\": \"en\",\n  \"notifications\": true\n}",
    "encoding": "utf8"
  }
}
```

---

### Uploading a Binary File (Image)

**User request:**

> "Save this small icon as a PNG file"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "icon.png",
    "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "encoding": "base64"
  }
}
```

---

### Listing All Files

**User request:**

> "What files do I have stored?"

**Tool call:**

```json
{
  "name": "list_files",
  "arguments": {}
}
```

**Response:**

```json
[
  {
    "name": "shopping.txt",
    "type": "file"
  },
  {
    "name": "config.json",
    "type": "file"
  },
  {
    "name": "images",
    "type": "directory"
  }
]
```

---

### Reading a File

**User request:**

> "Show me what's in my shopping list"

**Tool call:**

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "shopping.txt",
    "encoding": "utf8"
  }
}
```

**Response:**

```
- Milk
- Eggs
- Bread
- Butter
```

---

### Getting File Information

**User request:**

> "How big is my config file and when was it last modified?"

**Tool call:**

```json
{
  "name": "get_file_info",
  "arguments": {
    "filename": "config.json"
  }
}
```

**Response:**

```json
{
  "name": "config.json",
  "size": 89,
  "sizeHuman": "89 Bytes",
  "created": "2025-01-15T10:30:00.000Z",
  "modified": "2025-01-15T10:30:00.000Z",
  "isDirectory": false
}
```

---

### Deleting a File

**User request:**

> "Delete the old shopping list"

**Tool call:**

```json
{
  "name": "delete_file",
  "arguments": {
    "filename": "shopping.txt"
  }
}
```

**Response:**

```
File "shopping.txt" deleted successfully
```

---

### Creating a Directory

**User request:**

> "Create a folder called 'documents' for my files"

**Tool call:**

```json
{
  "name": "create_directory",
  "arguments": {
    "dirname": "documents"
  }
}
```

**Response:**

```
Directory "documents" created successfully
```

---

## Advanced Patterns

### Storing Code Snippets

**User request:**

> "Save this Python function for later"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "fibonacci.py",
    "content": "def fibonacci(n):\n    \"\"\"Generate the first n Fibonacci numbers.\"\"\"\n    fib = [0, 1]\n    for i in range(2, n):\n        fib.append(fib[i-1] + fib[i-2])\n    return fib[:n]\n\nif __name__ == '__main__':\n    print(fibonacci(10))",
    "encoding": "utf8"
  }
}
```

---

### Storing Markdown Notes

**User request:**

> "Save my meeting notes as markdown"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "meeting-2025-01-15.md",
    "content": "# Project Meeting - January 15, 2025\n\n## Attendees\n- Alice\n- Bob\n- Charlie\n\n## Agenda\n1. Q4 Review\n2. Q1 Planning\n3. Resource allocation\n\n## Action Items\n- [ ] Alice: Prepare budget report\n- [ ] Bob: Schedule client calls\n- [ ] Charlie: Update documentation\n\n## Next Meeting\nJanuary 22, 2025 at 2:00 PM",
    "encoding": "utf8"
  }
}
```

---

### Storing and Retrieving Binary Data

**User request:**

> "Download the icon I saved earlier as base64"

**Tool call:**

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "icon.png",
    "encoding": "base64"
  }
}
```

**Response:**

```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

---

### Organizing Files

**Workflow:**

1. Create directories for organization:

```json
{
  "name": "create_directory",
  "arguments": { "dirname": "projects" }
}
```

2. List to verify:

```json
{
  "name": "list_files",
  "arguments": {}
}
```

---

### Updating a File

To update a file, simply upload with the same filename (overwrites):

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "config.json",
    "content": "{\n  \"theme\": \"light\",\n  \"language\": \"es\",\n  \"notifications\": false\n}",
    "encoding": "utf8"
  }
}
```

---

## Common Use Cases

### Personal Knowledge Base

Store notes, snippets, and references:

```
storage/
├── notes/
├── code-snippets/
├── bookmarks.json
└── todo.md
```

### Configuration Backup

Store application configs:

```
storage/
├── vscode-settings.json
├── bash-aliases.sh
├── gitconfig
└── ssh-config
```

### Project Assets

Store project files:

```
storage/
├── project-a/
│   ├── requirements.txt
│   └── notes.md
├── project-b/
│   ├── config.yaml
│   └── schema.sql
└── templates/
    ├── readme-template.md
    └── license.txt
```

### Data Exchange

Use the file server to exchange data between conversations:

1. Upload data in one conversation
2. Download and use in another conversation

---

## Error Handling Examples

### File Not Found

**Tool call:**

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "nonexistent.txt"
  }
}
```

**Response:**

```json
{
  "content": [
    { "type": "text", "text": "Error: File \"nonexistent.txt\" not found" }
  ],
  "isError": true
}
```

### Delete Non-existent File

**Tool call:**

```json
{
  "name": "delete_file",
  "arguments": {
    "filename": "already-deleted.txt"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Could not delete \"already-deleted.txt\". File may not exist."
    }
  ],
  "isError": true
}
```

---

## Tips and Tricks

1. **Use descriptive filenames** - Include dates, project names, or categories
2. **Use JSON for structured data** - Easy to read and modify
3. **Use Markdown for notes** - Formatted text that's still readable as plain text
4. **Create directories first** - Organize before storing many files
5. **Check file info before downloading** - Verify file exists and check size
6. **Use base64 for binary files** - Images, PDFs, etc.
