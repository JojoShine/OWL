---
trigger: glob
glob: /Users/jojoshine/projects/owl_platform/CLAUDE.md
---
Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information.

---

Code Style Consistency (代码风格一致性)

**CRITICAL: Always maintain consistency with existing codebase patterns**

Before writing any new code, you MUST:

1. **Read Similar Existing Code First**
    - Find similar features/modules in the codebase
    - Study their code structure, naming conventions, and patterns
    - Use them as reference templates for new code

2. **Backend Code Style**
    - File structure: Follow existing module structure (controller → service → routes → validation)
    - Naming: Use existing naming patterns (camelCase for functions, PascalCase for classes)
    - Error handling: Use ApiError class consistently
    - Logging: Use logger from config/logger.js
    - Database: Follow existing Sequelize patterns and query styles
    - API responses: Use response helpers (success, paginated, list) from utils/response.js

3. **Frontend Code Style**
    - Component structure: Follow existing component patterns
    - Naming: Match existing file and component naming conventions
    - State management: Use existing patterns (useState, useEffect, etc.)
    - API calls: Use existing API client patterns from lib/api
    - UI components: Use existing shadcn/ui components and patterns
    - Styling: Follow existing Tailwind CSS usage patterns

4. **Key Principles**
    - ✅ DO: Copy patterns from similar existing code
    - ✅ DO: Maintain consistent indentation and formatting
    - ✅ DO: Use the same libraries and utilities as existing code
    - ❌ DON'T: Introduce new patterns without discussion
    - ❌ DON'T: Mix different coding styles in the same codebase
    - ❌ DON'T: Use different error handling or response formats

5. **Before Submitting Code**
    - Compare your new code with similar existing code
    - Ensure naming conventions match
    - Verify you're using the same utilities and helpers
    - Check that error handling follows existing patterns

**Remember: Consistency is more important than personal preference. Always follow the existing codebase style.**

