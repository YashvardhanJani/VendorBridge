# VendorBridge — Contributing Guidelines

> **Document Status**: Current as of June 2026  
> **Last Updated**: June 2026

Developer guidelines, code standards, and contribution workflow.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Documentation](#documentation)

---

## Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/vendorbridge.git
cd vendorbridge

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/vendorbridge.git
```

### 2. Create Feature Branch

```bash
# Always create new branch from latest main
git fetch upstream
git checkout -b feature/your-feature-name upstream/main

# Branch naming convention:
# feature/add-user-authentication
# bugfix/fix-rfq-status-display
# docs/update-setup-guide
# chore/update-dependencies
```

### 3. Setup Development Environment

```bash
# Install dependencies
npm install

# Setup backend
cd server
npm install
cp .env.example .env
npm run dev

# In new terminal, setup frontend
cd ../client
npm install
npm run dev

# Both should be running on localhost:5000 and localhost:5173
```

---

## Development Workflow

### Feature Development

1. **Identify the scope**: Small, focused changes are better
2. **Create backend first**: Model → Validator → Controller → Route
3. **Test with Postman/curl**
4. **Create frontend**: Service call → Component → Page
5. **Test end-to-end**
6. **Add documentation**
7. **Submit PR for review**

### Example: Adding New Endpoint

**1. Backend Setup**

```typescript
// server/src/models/MyModel.ts
export interface MyEntity {
  id: number;
  name: string;
  createdAt: Date;
}

export async function findById(id: number): Promise<MyEntity | null> {
  const query = 'SELECT * FROM my_entities WHERE id = ?';
  const [rows] = await db.query(query, [id]);
  return rows[0] || null;
}
```

**2. Validation Schema**

```typescript
// server/src/validators/myEntity.ts
import { z } from 'zod';

export const createMyEntitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
});

export type CreateMyEntityInput = z.infer<typeof createMyEntitySchema>;
```

**3. Controller**

```typescript
// server/src/controllers/myController.ts
import { validate } from '../middleware/validate';
import { createMyEntitySchema } from '../validators/myEntity';

export const createEntity = async (req: Request, res: Response) => {
  try {
    const body = validate(createMyEntitySchema, req.body);
    
    const query = 'INSERT INTO my_entities (name, description) VALUES (?, ?)';
    const result = await db.query(query, [body.name, body.description]);
    
    // Log activity
    await ActivityLog.create({
      entityType: 'MyEntity',
      entityId: result.insertId,
      action: 'Created',
      userId: req.user.id,
      description: `Created entity: ${body.name}`,
    });
    
    res.status(201).json({
      success: true,
      data: { id: result.insertId, ...body },
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};
```

**4. Route**

```typescript
// server/src/routes/myRoutes.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { createEntity } from '../controllers/myController';

const router = express.Router();

router.post('/', authenticate, createEntity);

export default router;
```

**5. Register Route**

```typescript
// server/src/server.ts
import myRoutes from './routes/myRoutes';

app.use('/api/my-entities', myRoutes);
```

**6. Frontend Service**

```typescript
// client/src/services/api.ts
export const createMyEntity = async (data: any) => {
  const response = await axios.post('/my-entities', data);
  return response.data;
};
```

**7. Frontend Component**

```typescript
// client/src/pages/MyPage.tsx
import { createMyEntity } from '../services/api';

export function MyPage() {
  const [name, setName] = useState('');
  
  const handleCreate = async () => {
    try {
      const result = await createMyEntity({ name });
      toast.success('Created successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
```

**8. Update Documentation**

- Add endpoint to [docs/API_CONTRACT.md](./API_CONTRACT.md)
- Update [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) if schema changed
- Update [docs/ARCHITECTURE.md](./ARCHITECTURE.md) if structure changed

---

## Code Standards

### TypeScript

- **Strict mode**: `"strict": true` in `tsconfig.json`
- **Type annotations**: Always annotate function parameters and returns
- **No `any`**: Use `unknown` if type is truly dynamic, then narrow it

```typescript
// ✓ Good
function processData(data: string): string[] {
  return data.split(',');
}

// ✗ Bad
function processData(data: any) {
  return data.split(',');
}
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `user-controller.ts` |
| Functions | camelCase | `getUserById()` |
| Classes | PascalCase | `UserController` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES = 3` |
| Interfaces | PascalCase | `IUser`, `User` |
| Types | PascalCase | `UserRole`, `StatusEnum` |
| Enums | PascalCase | `UserStatus`, `RFQStatus` |
| Database | snake_case | `user_id`, `created_at` |
| Directories | kebab-case | `user-service/` |

### Formatting

- **Indentation**: 2 spaces (configured in `.editorconfig`)
- **Line length**: 80-100 characters max
- **Semicolons**: Always use
- **Quotes**: Single quotes for strings
- **Commas**: Always trailing commas in objects

```typescript
// ✓ Good
const user: IUser = {
  id: 1,
  name: 'John',
  role: 'Officer',
};

// ✗ Bad
const user: any = { id: 1, name: 'John', role: 'Officer' }
```

### Error Handling

```typescript
// ✓ Good
try {
  const user = await getUser(id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  return res.json({ success: true, data: user });
} catch (error) {
  logger.error('Error fetching user:', error);
  return res.status(500).json({ success: false, error: 'Internal server error' });
}

// ✗ Bad
try {
  const user = await getUser(id);
  return res.json(user);
} catch (e) {
  console.log(e); // Don't log to console in production
}
```

### Comments & Documentation

- Write clear, self-documenting code
- Add comments for **why**, not **what**
- JSDoc for public functions and types

```typescript
// ✓ Good
/**
 * Calculates total amount for an invoice including tax
 * Handles both CGST+SGST and IGST based on GSTIN
 * @param items - Line items with prices
 * @param gstin - Vendor GSTIN to determine tax type
 * @returns Total including tax
 */
function calculateInvoiceTotal(items: LineItem[], gstin: string): number {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = isInterState(gstin) ? 0.18 : 0.09; // IGST vs CGST+SGST
  return subtotal * (1 + taxRate);
}

// ✗ Bad
// Get total
function getTotal(items: any[], gstin: string) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.qty; // Add item price
  }
  if (gstin.charCodeAt(0) === 49) { // Check if first char is '1'
    total = total * 1.18;
  } else {
    total = total * 1.09;
  }
  return total;
}
```

### Performance

- Avoid N+1 queries: Batch queries instead of looping
- Use database indexes for frequently queried fields
- Implement caching for static/slow data
- Paginate large result sets

```typescript
// ✗ Bad - N+1 queries
const rfqs = await RFQ.findAll();
for (const rfq of rfqs) {
  rfq.vendor = await Vendor.findById(rfq.vendorId);
}

// ✓ Good - Single query with JOIN
const rfqs = await db.query(`
  SELECT r.*, v.* 
  FROM rfqs r 
  JOIN vendors v ON r.vendor_id = v.id
`);
```

---

## Commit Conventions

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(rfq): add RFQ comparison matrix` |
| `fix` | Bug fix | `fix(auth): resolve JWT expiry issue` |
| `docs` | Documentation | `docs: update setup guide` |
| `style` | Code style (no logic change) | `style(client): format components` |
| `refactor` | Code refactoring | `refactor(db): optimize vendor queries` |
| `test` | Add/update tests | `test(rfq): add status transition tests` |
| `chore` | Maintenance | `chore: update dependencies` |

### Examples

```bash
# Good commits
git commit -m "feat(rfq): add bulk RFQ import feature

- Supports CSV file upload
- Validates all items before import
- Shows import progress bar
- Fixes #123"

git commit -m "fix(invoice): correct GST calculation for inter-state sales

CGST+SGST was being applied to inter-state vendors.
Now correctly checks GSTIN prefix and applies IGST only.

Fixes #456"

git commit -m "docs: add deployment guide for production"

# Less ideal - too vague
git commit -m "update stuff"
git commit -m "fix bug"
```

---

## Pull Request Process

### 1. Create PR on GitHub

```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR on GitHub with title and description
```

### 2. PR Description Template

```markdown
## Description
Brief explanation of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Breaking change

## Related Issues
Closes #123

## Testing
Explain how to test these changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings generated
- [ ] Changes tested locally
```

### 3. Code Review Process

- At least one approval required before merge
- Automated checks must pass (TypeScript, ESLint, tests)
- No merge conflicts
- Commits squashed if needed

### 4. Address Feedback

```bash
# Make changes based on review
git add .
git commit --amend     # If only 1 commit, amend it
git push --force-with-lease origin feature/your-feature-name

# Or create new commit if multiple changes
git add .
git commit -m "fix: address code review feedback"
git push origin feature/your-feature-name
```

### 5. Merge

- Squash and merge for feature branches
- Keep commit history linear
- Delete branch after merge

---

## Testing

### Unit Tests

```typescript
// Example test
describe('calculateInvoiceTotal', () => {
  test('should calculate IGST for inter-state sales', () => {
    const items = [{ total: 1000 }];
    const gstin = '18AABCU9603R1Z0'; // Inter-state
    
    const result = calculateInvoiceTotal(items, gstin);
    
    expect(result).toBe(1180); // 1000 * 1.18
  });
});
```

### Integration Tests

Test database operations and API endpoints:

```typescript
describe('POST /api/rfqs', () => {
  test('should create RFQ with valid data', async () => {
    const response = await request(app)
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test RFQ',
        deadline: '2026-12-31',
        items: [{ name: 'Item 1', qty: 5, unit: 'Pieces' }],
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Run Tests

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

---

## Documentation

### Update When

- ✅ Adding new endpoint → Update API_CONTRACT.md
- ✅ Changing database schema → Update DATABASE_SCHEMA.md
- ✅ Adding new feature → Update README.md features section
- ✅ Changing setup process → Update SETUP_GUIDE.md
- ✅ Adding new status/workflow → Update STATUS_FLOWS.md

### Comment Clearly

```typescript
// ✓ Good comments explain WHY
// We use GSTIN prefix (18 vs 27) to determine if inter-state
// IGST applies to inter-state, CGST+SGST to intra-state
const isInterState = (gstin: string) => gstin[0] !== '27';

// ✗ Bad comments just restate code
// Check the first character of gstin
const isInterState = (gstin: string) => gstin[0] !== '27';
```

---

## Common Issues

### TypeScript Errors After Pull

```bash
npm install --legacy-peer-deps
npm run build
```

### Port Already in Use

```bash
# Change port in .env or kill existing process
PORT=5001 npm run dev
```

### Git Merge Conflicts

```bash
# Resolve conflicts manually, then:
git add .
git commit -m "fix: resolve merge conflicts"
git push
```

### PR Checks Failing

```bash
# Run checks locally
npm run lint
npm run build
npm test
```

---

## Questions?

- Check [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- Check [docs/API_CONTRACT.md](./API_CONTRACT.md) for API details
- Review existing code in `/server/src/controllers/` for patterns
- Ask in PR comments or create an issue

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

**Welcome to VendorBridge! Thank you for contributing!** ❤️

</div>
