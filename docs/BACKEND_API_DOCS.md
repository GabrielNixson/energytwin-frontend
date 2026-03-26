# Backend API Documentation: Energy Twin

This document provides technical specifications for the backend APIs required to support the Energy Twin frontend.

## 1. Data Models (Consistent with Frontend Types)

### Project Model
| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Unique project identifier |
| `name` | `string` | Project title |
| `createdAt` | `timestamp` | ISO date string |
| `tabs` | `Tab[]` | Associated layout tabs |

### Tab Model
| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Unique tab identifier |
| `name` | `string` | Tab name (e.g., 'Main Tab', 'Living Room') |
| `charts` | `ChartData[]` | The layout configuration for this tab |

### ChartData Model (The Grid Layout)
This model defines how a chart is positioned and sized in the 12-column grid.
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique chart instance ID |
| `type` | `string` | Chart type: `bar`, `line`, `area`, `pie`, `gauge`, `progressBar`, `circularProgress`, `billing` |
| `title` | `string` | Display title |
| `x` | `number` | Grid column start (0-11) |
| `y` | `number` | Grid row start |
| `w` | `number` | Grid width in units (1-12) |
| `h` | `number` | Grid height in units |
| `config` | `object` | See `ChartConfig` below |

### ChartConfig Model
| Field | Type | Description |
|---|---|---|
| `showTooltips` | `boolean` | Display tooltips on hover |
| `showLegend` | `boolean` | Display the legend |
| `showGrid` | `boolean` | Display X/Y background grid |
| `xAxisLabel` | `string` | Label for X axis |
| `yAxisLabel` | `string` | Label for Y axis |
| `yAxisMax` | `number?` | (Optional) Fixed Y-axis upper limit |
| `color` | `string?` | Primary theme color for this chart (e.g., HEX) |

---

## 2. API Endpoints

### 2.1 Project Management

#### `GET /api/projects`
Retrieves a list of all projects.
- **Response**: `200 OK` with JSON array of Project objects.

#### `POST /api/projects`
Creates a new project.
- **Body**: `{ "name": "Project Name", "location?": "..." }`
- **Response**: `201 Created` with the new Project ID.

#### `DELETE /api/projects/:projectId`
Removes a project and all its configurations.
- **Response**: `204 No Content`.

---

### 2.2 Tab Management

#### `POST /api/projects/:projectId/tabs`
Adds a new tab to a project.
- **Body**: `{ "name": "Bedroom" }`
- **Response**: `201 Created` with JSON `{ "tabId": "uuid" }`.

#### `PUT /api/projects/:projectId/tabs/:tabId/name`
Renames a tab.
- **Body**: `{ "name": "New Name" }`

#### `DELETE /api/projects/:projectId/tabs/:tabId`
Removes a tab.

---

### 2.3 Dashboard Layout (Grid Persistence)

#### `PUT /api/projects/:projectId/tabs/:tabId/layout`
Saves the entire chart layout for a specific tab.
- **IMPORTANT**: This endpoint receives the full array of `ChartData` (with grid `x`, `y`, `w`, `h` positions).
- **Body**: `ChartData[]` array.
- **Constraint**: Each item must have an `id` and valid grid coordinates.

---

### 2.4 Chart Source Data (The Real Charts)

#### `GET /api/data/chart/:chartId`
Fetches the actual metrics to be plotted (Labels and Datasets).
- **Query Params**: `timeRange`, `granularity`
- **Response**:
```json
{
  "labels": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
  "datasets": [
    {
      "label": "Energy Consumption (kWh)",
      "data": [65, 59, 80, 81, 56, 55],
      "color": "#917efc"
    }
  ]
}
```

---

## 3. Best Practices for Implementation

1.  **Grid Units**: The frontend uses a 12-column grid. Ensure that vertical scaling (the `h` property) is respected in the persistence layer.
2.  **Stateless Storage**: The layout should be stored as JSON to allow flexibility as new chart types are added.
3.  **Real-time Updates**: Highly recommend implementing WebSockets if the charts need to update in real-time as energy data is consumed.
4.  **Error Handling**: If a tab is deleted, cascade deletion to all its saved chart configurations.
