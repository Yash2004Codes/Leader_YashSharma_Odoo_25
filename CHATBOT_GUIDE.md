# Chatbot Assistant Guide

## Overview
The Inventory Management Chatbot is an intelligent assistant integrated into your supply chain management system. It helps users quickly find information, check stock levels, and get answers to common questions without navigating through multiple pages.

## Features

### 🎯 What the Chatbot Can Do

1. **Stock Information**
   - Check stock levels for specific products
   - View available quantities across warehouses
   - Get stock summaries

2. **Product Search**
   - Find products by name or SKU
   - View product details (category, unit of measure, reorder levels)
   - List all products

3. **Order Management**
   - Check pending receipts
   - View pending delivery orders
   - Monitor internal transfers
   - Get order counts and status

4. **Low Stock Alerts**
   - Identify products below reorder levels
   - Get detailed low stock reports
   - View out-of-stock items

5. **Dashboard Statistics**
   - Get summary of total products
   - View pending orders count
   - Check system overview

6. **General Help**
   - Learn how to use the system
   - Get guidance on features
   - Understand available commands

## How to Use

### Accessing the Chatbot

1. The chatbot appears as a floating button in the bottom-right corner of all dashboard pages
2. Click the blue message icon to open the chat window
3. The chat window can be minimized by clicking the X button

### Example Queries

#### Stock Queries
```
"What's the stock of Product X?"
"Show me inventory for SKU ABC123"
"Check stock levels"
"What's available in Warehouse Main?"
```

#### Product Queries
```
"Find product with SKU ABC123"
"Show me product details for Product X"
"How many products are there?"
"List all products"
```

#### Order Queries
```
"How many pending receipts?"
"Show me pending deliveries"
"What transfers are scheduled?"
"Check order status"
```

#### Low Stock Queries
```
"Show me low stock items"
"What products need reordering?"
"Which items are out of stock?"
"Alert me about low inventory"
```

#### Dashboard Queries
```
"Give me a dashboard summary"
"Show me statistics"
"What's the overview?"
```

#### Help Queries
```
"Help"
"How do I use this system?"
"What can you help me with?"
"Guide me"
```

## Chatbot Interface

### Chat Window Features

- **Header**: Shows "Inventory Assistant" with bot icon
- **Message Area**: Displays conversation history with timestamps
- **Input Field**: Type your questions here
- **Send Button**: Submit your query
- **Suggestions**: Helpful hints appear below the input

### Message Formatting

- User messages appear on the right (blue background)
- Assistant messages appear on the left (white background)
- Bot icon for assistant messages
- User icon for your messages
- Timestamps for each message

## Technical Details

### API Endpoint
- **Route**: `/api/chatbot`
- **Method**: POST
- **Authentication**: Required (JWT token)

### Request Format
```json
{
  "message": "What's the stock of Product X?",
  "conversationHistory": []
}
```

### Response Format
```json
{
  "message": "Stock information for Product X...",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Query Processing

The chatbot uses intelligent query processing to understand user intent:

1. **Keyword Detection**: Identifies key terms (stock, product, order, etc.)
2. **Context Extraction**: Extracts product names, SKUs, warehouse names
3. **Database Queries**: Fetches relevant data from Supabase
4. **Response Generation**: Formats data into user-friendly responses

## Integration

The chatbot is integrated into the `DashboardLayout` component, making it available on all pages:
- Dashboard
- Products
- Receipts
- Deliveries
- Transfers
- Adjustments
- History
- Settings

## Customization

### Adding New Query Handlers

To add new query types, edit `/app/api/chatbot/route.ts`:

```typescript
// Add new handler function
async function handleNewQuery(query: string): Promise<string> {
  // Your logic here
  return 'Response';
}

// Add to main POST handler
if (userMessage.includes('new keyword')) {
  response = await handleNewQuery(userMessage);
}
```

### Styling

The chatbot uses Tailwind CSS. Customize styles in `/components/chatbot/Chatbot.tsx`:
- Colors: Blue theme (bg-blue-600)
- Size: 384px width, 600px height
- Position: Fixed bottom-right

## Best Practices

1. **Be Specific**: More specific queries get better results
   - ✅ "What's the stock of Product ABC in Main Warehouse?"
   - ❌ "stock"

2. **Use Product Names or SKUs**: The chatbot can search by both
   - ✅ "Find product SKU123"
   - ✅ "Show stock for Widget A"

3. **Natural Language**: The chatbot understands natural language
   - ✅ "How many pending deliveries do we have?"
   - ✅ "Show me items that need reordering"

## Troubleshooting

### Chatbot Not Appearing
- Ensure you're logged in
- Check browser console for errors
- Verify the component is imported in DashboardLayout

### No Response
- Check network connection
- Verify authentication token
- Check API endpoint is accessible

### Incorrect Answers
- Be more specific in your query
- Check if the data exists in the database
- Try rephrasing your question

## Future Enhancements

Potential improvements:
- Conversation memory across sessions
- Voice input support
- Multi-language support
- Advanced analytics queries
- Integration with external APIs
- Machine learning for better understanding
- Proactive alerts and notifications

## Support

For issues or questions about the chatbot:
1. Check this guide first
2. Review the API logs
3. Check browser console for errors
4. Verify database connectivity

