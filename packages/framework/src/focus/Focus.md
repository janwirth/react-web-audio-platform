# Focus

A keyboard-accessible container system that enables directional navigation and overscroll behavior between focusable areas.

Navigation works two layers deep:

- **Layer 1**: `Focusable` components create focusable containers that can receive focus
- **Layer 2**: Components inside use `useFocus` hook to handle internal navigation within their container

## Quick Start

Two-layer navigation: wrap containers with `Focusable` and use `useFocus` inside for internal navigation.

```tsx
import {useFocus, Focusable}

// Layer 1: Wrap containers to make them focusable
<Focusable>
  {/* Layer 2: Use hook inside for internal navigation */}
  <YourComponent />
</Focusable>

// Inside YourComponent:
const {isFocused} = useFocus({
  onArrowDown: () => {
    // Handle navigation or return 'overscroll-down'
  }
})
```

## Features

- **Focus by direction**: Navigate between focusable containers using arrow keys
- **Overscroll behavior**: Handle edge cases when reaching boundaries
- **Spatial navigation**: Move focus between adjacent containers based on direction

## API

### `useFocus(options)`

Hook that provides focus state and handles directional navigation.

**Options:**

- `onArrowUp?: () => void | 'overscroll-up'` - Handle up arrow key
- `onArrowDown?: () => void | 'overscroll-down'` - Handle down arrow key
- `onArrowLeft?: () => void | 'overscroll-left'` - Handle left arrow key
- `onArrowRight?: () => void | 'overscroll-right'` - Handle right arrow key

**Returns:**

- `isFocused: boolean` - Whether this container currently has focus

**Overscroll return values:**

- Return `'overscroll-{direction}'` to signal that navigation should move to the next focusable container in that direction
- If handler returns nothing (undefined), default behavior is to overscroll in the pressed direction

### `Focusable`

Wrapper component that makes a container focusable and enables spatial navigation.

## Usage

```tsx
import {useFocus, Focusable}

const MyApp = () => {
    return <div>
        <Focusable><Scroller items={itemsA}/></Focusable>
        <Focusable><Scroller items={itemsB}/></Focusable>
    </div>
}

const Scroller = ({items}) => {
    const [cursor, setCursor] = useState(0)
    const {isFocused} = useFocus({
        onArrowDown: () => {
            if (cursor >= items.length - 1) {
                return 'overscroll-down'
            } else {
                setCursor(c => c + 1)
            }
        },
        onArrowUp: () => {
            if (cursor <= 0) {
                return 'overscroll-up'
            } else {
                setCursor(c => c - 1)
            }
        }
    })

    return <div className={isFocused ? 'focused' : ''}>
        {items.map((item, i) => (
            <div key={i} className={i === cursor ? 'active' : ''}>
                {item}
            </div>
        ))}
    </div>
}
```

## Overscroll Behavior

When a handler returns an overscroll value (e.g., `'overscroll-down'`), the focus system will:

1. Move focus to the next `Focusable` container in that direction
2. If no container exists in that direction, focus remains unchanged

If a handler doesn't return a value and navigation would exceed boundaries, the default behavior is to overscroll in the pressed direction.
