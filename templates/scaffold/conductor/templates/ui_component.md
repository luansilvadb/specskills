# UI Component Template

## Overview
<!-- Introduce the UI component, its purpose, and the problem it solves within the project. -->

## Design Properties
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `variant` | `string` | `primary` | The visual style variant (primary, secondary). |
| `size` | `string` | `md` | The size of the component (sm, md, lg). |

## Usage Example
Provide a practical example of how to implement this component in Code:

```tsx
import { TargetComponent } from './TargetComponent';

export const Example = () => {
    return (
        <TargetComponent variant="primary" size="lg">
            Example Content
        </TargetComponent>
    );
}
```

## Accessibility Checklist
- [ ] Uses semantic HTML where appropriate.
- [ ] Provides `aria-labels` or alternative text for visually hidden elements.
- [ ] Support for keyboard navigation (Tab/Enter/Space).
