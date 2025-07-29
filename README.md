### Issues

**Title:** Refactor Xn to defineProperties  
**Body:** Rename the function `Xn` to `defineProperties` for improved clarity and consistency with naming conventions.  
**Labels:** refactor, code-cleanup  
---

**Title:** Investigate Class Hierarchy for y  
**Body:** Determine whether class `y` is a subclass of `Container`.

Context:
Subclasses of `y` are calling `this.addChild()` within a context `ctx`. This behavior suggests `y` might be a `Container`, but it needs confirmation.  
**Labels:** question, architecture  
---

**Title:** Add 'Open URL' Button in SpriteHub  
**Body:** Add a button to SpriteHub that allows users to fetch an image from a URL instead of uploading a local file.

Tasks:
- Add input field for URL
- Add button to trigger fetch
- Display fetched image in the UI
- Handle errors (e.g., invalid URL, CORS)  
**Labels:** enhancement, UI, SpriteHub  
---

**Title:** Create Sprite Viewer Page  
**Body:** Create a second page in SpriteHub to view and manage saved sprites.

Features:
- Display saved sprites in a list or grid
- Allow selection of sprites
- Enable naming and saving animations to a JSON file

Tasks:
- Build new page layout
- Load and display saved sprites
- Implement selection and naming UI
- Generate and save animations JSON  
**Labels:** feature, UI, SpriteHub  
