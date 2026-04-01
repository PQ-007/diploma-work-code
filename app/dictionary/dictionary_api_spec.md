# Dictionary Module — API Specification

## Base URL

All endpoints are relative to `/api/dictionary`.

---

## 1. GET /api/dictionary

**Browse / list dictionary entries with filters and pagination.**

### Query Parameters

| Param    | Type   | Default    | Description                                 |
| -------- | ------ | ---------- | ------------------------------------------- |
| search   | string | –          | Full-text + trigram search query            |
| language | string | –          | Filter by `language_code` (mn/ja/en)        |
| tag      | string | –          | Filter by tag name                          |
| sort     | string | `newest`   | `relevance` / `newest` / `most_saved`       |
| status   | string | `approved` | `approved` / `my_drafts` / `pending_review` |
| page     | number | 1          | Page number                                 |
| limit    | number | 20         | Items per page (max 50)                     |
| letter   | string | –          | Single letter to filter by first character  |

### Response 200

```json
{
  "entries": [
    {
      "id": 1,
      "term": "Machine Learning",
      "slug": "machine-learning",
      "reading": null,
      "language_code": "en",
      "definition": "A subset of AI that enables...",
      "status": "approved",
      "views": 42,
      "saves": 7,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T08:00:00Z",
      "author": {
        "id": "uuid",
        "display_name": "John Doe",
        "user_name": "johndoe",
        "avatar_url": "https://..."
      },
      "tags": ["ai", "data-science"],
      "saved": false
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## 2. POST /api/dictionary

**Create a new dictionary entry.**

### Request Body

```json
{
  "term": "Machine Learning",
  "reading": null,
  "language_code": "en",
  "definition": "A subset of AI that enables systems to learn from data.",
  "translations": [
    {
      "language_code": "mn",
      "translated_term": "Машин сургалт",
      "explanation": "Өгөгдлөөс суралцах боломжтой AI-ийн дэд бүлэг"
    },
    {
      "language_code": "ja",
      "translated_term": "機械学習",
      "explanation": "データから学習できるAIのサブセット"
    }
  ],
  "examples": [
    {
      "example_text": "Machine learning is used in spam filters.",
      "source": "Textbook",
      "context": "Email filtering",
      "language_code": "en"
    }
  ],
  "tags": ["ai", "data-science"],
  "submit": false
}
```

| Field         | Type     | Required | Notes                                    |
| ------------- | -------- | -------- | ---------------------------------------- |
| term          | string   | Yes      |                                          |
| reading       | string   | No       | For Japanese terms (furigana)            |
| language_code | string   | Yes      | mn / ja / en                             |
| definition    | string   | Yes      |                                          |
| translations  | array    | No       | Array of translation objects             |
| examples      | array    | No       | Array of example objects                 |
| tags          | string[] | No       | Tag names (auto-created if new)          |
| submit        | boolean  | No       | `true` = pending_review, `false` = draft |

### Response 201

```json
{
  "entry": { "id": 1, "slug": "machine-learning", "status": "draft" },
  "message": "Entry created"
}
```

### Errors

- 401: Unauthorized
- 400: Missing required fields

---

## 3. GET /api/dictionary/[slug]

**Get full entry detail.**

### Response 200

```json
{
  "entry": {
    "id": 1,
    "term": "Machine Learning",
    "slug": "machine-learning",
    "reading": null,
    "language_code": "en",
    "definition": "A subset of AI...",
    "status": "approved",
    "views": 43,
    "saves": 7,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T08:00:00Z",
    "author": {
      "id": "uuid",
      "display_name": "John Doe",
      "user_name": "johndoe",
      "avatar_url": "https://..."
    },
    "tags": ["ai", "data-science"],
    "saved": true
  },
  "translations": [
    {
      "id": 1,
      "language_code": "mn",
      "translated_term": "Машин сургалт",
      "explanation": "...",
      "created_by": "uuid",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "examples": [
    {
      "id": 1,
      "example_text": "Machine learning is used in spam filters.",
      "source": "Textbook",
      "context": "Email filtering",
      "language_code": "en",
      "created_by": "uuid",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "revisions": [
    {
      "id": 1,
      "revision_number": 1,
      "change_summary": "Initial creation",
      "status": "approved",
      "author": "John Doe",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "moderationActions": [
    {
      "action": "approve",
      "reason": null,
      "moderator": "Admin User",
      "created_at": "2024-01-16T09:00:00Z"
    }
  ],
  "relatedEntries": [
    {
      "id": 2,
      "term": "Deep Learning",
      "slug": "deep-learning",
      "language_code": "en"
    }
  ]
}
```

### Errors

- 404: Entry not found (or not accessible)

---

## 4. PUT /api/dictionary/[slug]

**Update a draft entry (owner only).**

### Request Body

Same as POST /api/dictionary (all fields optional).

### Response 200

```json
{
  "success": true,
  "slug": "machine-learning"
}
```

### Errors

- 401: Unauthorized
- 403: Not owner or entry is not a draft
- 404: Entry not found

---

## 5. GET /api/dictionary/search

**Full-text + trigram search.**

### Query Parameters

| Param    | Type   | Default | Description             |
| -------- | ------ | ------- | ----------------------- |
| q        | string | –       | Search query (required) |
| language | string | –       | Filter by language_code |
| limit    | number | 10      | Max results (max 50)    |

### Response 200

```json
{
  "results": [
    {
      "id": 1,
      "term": "Machine Learning",
      "slug": "machine-learning",
      "reading": null,
      "language_code": "en",
      "definition": "A subset of AI...",
      "rank": 0.85
    }
  ]
}
```

---

## 6. POST /api/dictionary/save

**Toggle save/bookmark on an entry.**

### Request Body

```json
{
  "entry_id": 1
}
```

### Response 200

```json
{
  "saved": true
}
```

---

## 7. POST /api/dictionary/flashcard

**Create a flashcard from an approved entry.**

### Request Body

```json
{
  "entry_id": 1
}
```

### Response 201

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "Machine Learning",
    "back": "A subset of AI that enables systems to learn from data.\n\n---\nМашин сургалт\n機械学習"
  }
}
```

### Errors

- 401: Unauthorized
- 400: Entry not approved / flashcard already exists
- 404: Entry not found

---

## 8. POST /api/dictionary/duplicate-check

**Check for similar/duplicate terms before creating.**

### Request Body

```json
{
  "term": "Machine Learning",
  "language_code": "en"
}
```

### Response 200

```json
{
  "matches": [
    {
      "id": 1,
      "term": "Machine Learning",
      "slug": "machine-learning",
      "language_code": "en",
      "status": "approved",
      "similarity": 1.0
    }
  ]
}
```

---

## 9. POST /api/dictionary/propose-edit

**Propose an edit to an approved entry (creates new pending revision).**

### Request Body

```json
{
  "entry_id": 1,
  "term": "Machine Learning",
  "reading": null,
  "language_code": "en",
  "definition": "Updated definition...",
  "translations": [],
  "examples": [],
  "tags": ["ai", "data-science"],
  "change_summary": "Improved definition clarity"
}
```

### Response 201

```json
{
  "revision": { "id": 5, "revision_number": 3, "status": "pending_review" },
  "message": "Edit proposed"
}
```

### Errors

- 401: Unauthorized
- 404: Entry not found
- 400: Entry is not approved

---

## 10. GET /api/dictionary/moderate

**List moderation queue (teacher/admin only).**

### Query Parameters

| Param | Type   | Default | Description             |
| ----- | ------ | ------- | ----------------------- |
| page  | number | 1       | Page number             |
| limit | number | 20      | Items per page (max 50) |

### Response 200

```json
{
  "items": [
    {
      "id": 5,
      "entry_id": 1,
      "revision_number": 1,
      "term": "Machine Learning",
      "reading": null,
      "language_code": "en",
      "definition": "A subset of AI...",
      "change_summary": null,
      "status": "pending_review",
      "created_at": "2024-01-15T10:30:00Z",
      "is_new_entry": true,
      "author": {
        "id": "uuid",
        "display_name": "John Doe",
        "user_name": "johndoe",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20
}
```

### Errors

- 401: Unauthorized
- 403: Not a teacher/admin

---

## 11. POST /api/dictionary/moderate

**Approve or reject a pending revision (teacher/admin only).**

### Request Body

```json
{
  "revision_id": 5,
  "action": "approve",
  "reason": null
}
```

For rejection, `reason` is required:

```json
{
  "revision_id": 5,
  "action": "reject",
  "reason": "Definition is too vague. Please provide more specific details."
}
```

### Response 200

```json
{
  "success": true,
  "action": "approve",
  "revision_id": 5
}
```

### Errors

- 401: Unauthorized
- 403: Not a moderator
- 400: Invalid action / missing reason for rejection / revision not pending
- 404: Revision not found
