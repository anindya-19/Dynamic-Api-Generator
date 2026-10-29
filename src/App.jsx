import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Code, Play, FileText, Database, Copy, Check, RefreshCw, 
  Plus, Trash2, Edit3, Send, Terminal, AlertCircle, CheckCircle2, 
  Layers, ArrowRight, Server, Download, ShieldCheck, Zap
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Preset prompts for quick testing
const PRESETS = [
  {
    title: "Employee Management",
    prompt: "Build an API for Employee Management with Employee Name, Department, Joining Date, Salary and Reporting Manager."
  },
  {
    title: "Product Inventory",
    prompt: "Build an API for Product Inventory with Product Name, SKU, Price, Stock Quantity and Supplier Details."
  },
  {
    title: "Event Ticketing",
    prompt: "Build an API for Event Ticketing with Event Title, Venue, Date, Ticket Price, Available Seats, and Organizer Email."
  },
  {
    title: "Patient Health Records",
    prompt: "Build an API for Patient Medical Records with Full Name, Age, Blood Group, Diagnosis, Doctor Assigned, and Emergency Contact."
  }
];

// Fallback generator when offline or API call fails
const generateFallbackSchema = (promptText) => {
  const isProduct = promptText.toLowerCase().includes('product') || promptText.toLowerCase().includes('inventory');
  const isEvent = promptText.toLowerCase().includes('event') || promptText.toLowerCase().includes('ticket');
  
  if (isProduct) {
    return {
      entityName: "Product",
      endpointBase: "/api/v1/products",
      description: "API endpoints for managing product catalog, stock levels, and inventory.",
      fields: [
        { key: "id", label: "ID", type: "string", required: true, validation: { pattern: "UUID/String" }, defaultValue: "prod-101" },
        { key: "productName", label: "Product Name", type: "string", required: true, validation: { minLength: 2 }, defaultValue: "Wireless Mechanical Keyboard" },
        { key: "sku", label: "SKU", type: "string", required: true, validation: { pattern: "^[A-Z]{3}-\\d{4}$" }, defaultValue: "KEY-9082" },
        { key: "price", label: "Price ($)", type: "number", required: true, validation: { min: 0 }, defaultValue: 129.99 },
        { key: "stockQuantity", label: "Stock Quantity", type: "number", required: true, validation: { min: 0 }, defaultValue: 45 },
        { key: "supplierEmail", label: "Supplier Email", type: "email", required: false, validation: { pattern: "email" }, defaultValue: "supplier@techgears.com" },
        { key: "isAvailable", label: "Is Available", type: "boolean", required: true, validation: {}, defaultValue: true }
      ],
      seedData: [
        { id: "prod-101", productName: "Wireless Mechanical Keyboard", sku: "KEY-9082", price: 129.99, stockQuantity: 45, supplierEmail: "supplier@techgears.com", isAvailable: true },
        { id: "prod-102", productName: "UltraWide Gaming Monitor 34\"", sku: "MON-3401", price: 499.00, stockQuantity: 12, supplierEmail: "sales@displayhub.com", isAvailable: true },
        { id: "prod-103", productName: "Ergonomic Mesh Chair", sku: "CHR-1102", price: 249.50, stockQuantity: 0, supplierEmail: "support@officeergos.com", isAvailable: false }
      ]
    };
  } else if (isEvent) {
    return {
      entityName: "Event",
      endpointBase: "/api/v1/events",
      description: "API for managing concert, conference and event ticketing details.",
      fields: [
        { key: "id", label: "ID", type: "string", required: true, validation: {}, defaultValue: "evt-201" },
        { key: "eventTitle", label: "Event Title", type: "string", required: true, validation: { minLength: 3 }, defaultValue: "AI Tech Summit 2026" },
        { key: "venue", label: "Venue", type: "string", required: true, validation: {}, defaultValue: "Grand Convention Center, NY" },
        { key: "date", label: "Date", type: "date", required: true, validation: {}, defaultValue: "2026-11-15" },
        { key: "ticketPrice", label: "Ticket Price ($)", type: "number", required: true, validation: { min: 0 }, defaultValue: 89.00 },
        { key: "availableSeats", label: "Available Seats", type: "number", required: true, validation: { min: 0 }, defaultValue: 350 },
        { key: "organizerEmail", label: "Organizer Email", type: "email", required: true, validation: {}, defaultValue: "contact@aitechsummit.org" }
      ],
      seedData: [
        { id: "evt-201", eventTitle: "AI Tech Summit 2026", venue: "Grand Convention Center, NY", date: "2026-11-15", ticketPrice: 89.00, availableSeats: 350, organizerEmail: "contact@aitechsummit.org" },
        { id: "evt-202", eventTitle: "Indie Rock Night Live", venue: "The Warehouse Arena", date: "2026-12-01", ticketPrice: 45.00, availableSeats: 120, organizerEmail: "tickets@indierock.com" }
      ]
    };
  }

  // Default Employee Management
  return {
    entityName: "Employee",
    endpointBase: "/api/v1/employees",
    description: "API service to query, add, update and manage organization employee records.",
    fields: [
      { key: "id", label: "ID", type: "string", required: true, validation: { pattern: "emp_xxx" }, defaultValue: "emp-001" },
      { key: "employeeName", label: "Employee Name", type: "string", required: true, validation: { minLength: 2 }, defaultValue: "Sarah Jenkins" },
      { key: "department", label: "Department", type: "string", required: true, validation: { enumValues: ["Engineering", "Product", "Sales", "Design", "HR"] }, defaultValue: "Engineering" },
      { key: "joiningDate", label: "Joining Date", type: "date", required: true, validation: {}, defaultValue: "2023-04-12" },
      { key: "salary", label: "Salary ($)", type: "number", required: true, validation: { min: 10000 }, defaultValue: 115000 },
      { key: "reportingManager", label: "Reporting Manager", type: "string", required: false, validation: {}, defaultValue: "Alex Rivera" }
    ],
    seedData: [
      { id: "emp-001", employeeName: "Sarah Jenkins", department: "Engineering", joiningDate: "2023-04-12", salary: 115000, reportingManager: "Alex Rivera" },
      { id: "emp-002", employeeName: "Marcus Vance", department: "Product", joiningDate: "2022-09-01", salary: 128000, reportingManager: "Diana Prince" },
      { id: "emp-003", employeeName: "Aaliyah Patel", department: "Design", joiningDate: "2024-01-15", salary: 95000, reportingManager: "Alex Rivera" }
    ]
  };
};

export default function DynamicApiBuilder() {
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('playground'); // 'schema', 'playground', 'docs', 'export'
  const [copiedKey, setCopiedKey] = useState('');

  // Core Dynamic API Schema
  const [schema, setSchema] = useState(() => generateFallbackSchema(PRESETS[0].prompt));
  
  // In-Memory Database State
  const [dbData, setDbData] = useState(() => generateFallbackSchema(PRESETS[0].prompt).seedData);

  // API Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState('GET_ALL');
  const [requestParamId, setRequestParamId] = useState('');
  const [requestBodyText, setRequestBodyText] = useState('');
  const [requestHeaders, setRequestHeaders] = useState({ 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token_9981' });
  
  // Response State
  const [lastResponse, setLastResponse] = useState(null);
  const [activePlaygroundSubTab, setActivePlaygroundSubTab] = useState('tester'); // 'tester', 'dbState'

  // Generate AI Schema on Prompt Submit
  const handleGenerateSchema = async (targetPrompt = prompt) => {
    if (!targetPrompt.trim()) return;
    setIsLoading(true);

    try {
      const systemInstruction = `You are an expert Backend & API Architect. Given a natural language description of an API requirement, analyze it and generate a precise JSON schema specification for standard CRUD operations.

Return ONLY a valid JSON object matching this structure:
{
  "entityName": "Singular Name (e.g. Employee)",
  "endpointBase": "/api/v1/plural_name",
  "description": "Short overview of API capability",
  "fields": [
    {
      "key": "camelCaseFieldName",
      "label": "Human Readable Label",
      "type": "string" | "number" | "date" | "boolean" | "email",
      "required": boolean,
      "validation": { "min": number or null, "max": number or null, "minLength": number or null, "enumValues": string[] or null },
      "defaultValue": sample value
    }
  ],
  "seedData": [
    { ... 3 realistic sample record objects with "id" field ... }
  ]
}`;

      // api setup for gemini
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate API schema for: "${targetPrompt}"` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error('API Request Failed');

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        const parsed = JSON.parse(rawText);
        // Ensure ID field exists
        let fields = parsed.fields || [];
        if (!fields.some(f => f.key === 'id')) {
          fields.unshift({
            key: "id",
            label: "ID",
            type: "string",
            required: true,
            validation: {},
            defaultValue: "id-001"
          });
        }
        
        setSchema(parsed);
        setDbData(parsed.seedData && parsed.seedData.length > 0 ? parsed.seedData : generateFallbackSchema(targetPrompt).seedData);
        // Reset playground inputs
        if (parsed.seedData && parsed.seedData.length > 0) {
          setRequestParamId(parsed.seedData[0].id);
        }
        prepareRequestBody(parsed, 'POST');
      } else {
        throw new Error('Invalid AI response structure');
      }
    } catch (err) {
      console.warn("Using intelligent fallback parser:", err);
      const fallback = generateFallbackSchema(targetPrompt);
      setSchema(fallback);
      setDbData(fallback.seedData);
      setRequestParamId(fallback.seedData[0].id);
      prepareRequestBody(fallback, 'POST');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to prefill POST/PUT payload JSON
  const prepareRequestBody = (currentSchema = schema, mode = 'POST', existingRecord = null) => {
    if (existingRecord) {
      setRequestBodyText(JSON.stringify(existingRecord, null, 2));
      return;
    }
    const sampleObj = {};
    currentSchema.fields.forEach(field => {
      if (mode === 'POST' && field.key === 'id') return; // ID is generated or omitted on POST
      sampleObj[field.key] = field.defaultValue ?? (field.type === 'number' ? 100 : field.type === 'boolean' ? true : "Sample text");
    });
    setRequestBodyText(JSON.stringify(sampleObj, null, 2));
  };

  // Synchronize request body when endpoint selection changes
  useEffect(() => {
    if (selectedEndpoint === 'POST') {
      prepareRequestBody(schema, 'POST');
    } else if (selectedEndpoint === 'PUT') {
      const match = dbData.find(d => String(d.id) === String(requestParamId)) || dbData[0];
      if (match) {
        prepareRequestBody(schema, 'PUT', match);
      }
    }
  }, [selectedEndpoint, requestParamId, schema]);

  // Set default param ID on dbData change
  useEffect(() => {
    if (dbData.length > 0 && !requestParamId) {
      setRequestParamId(dbData[0].id);
    }
  }, [dbData]);

  // In-Memory Dynamic API Request Execution Simulator
  const handleExecuteRequest = () => {
    const startTime = performance.now();
    
    // Default response container
    let responseCode = 200;
    let responseStatusText = "OK";
    let bodyData = null;
    let errors = [];

    const endpointPath = schema.endpointBase;

    try {
      if (selectedEndpoint === 'GET_ALL') {
        responseCode = 200;
        responseStatusText = "OK";
        bodyData = {
          success: true,
          count: dbData.length,
          data: dbData
        };
      } 
      else if (selectedEndpoint === 'GET_BY_ID') {
        if (!requestParamId) {
          responseCode = 400;
          responseStatusText = "Bad Request";
          bodyData = { success: false, error: "Missing path parameter 'id'" };
        } else {
          const record = dbData.find(item => String(item.id) === String(requestParamId));
          if (record) {
            responseCode = 200;
            responseStatusText = "OK";
            bodyData = { success: true, data: record };
          } else {
            responseCode = 404;
            responseStatusText = "Not Found";
            bodyData = { success: false, error: `${schema.entityName} with ID '${requestParamId}' not found.` };
          }
        }
      } 
      else if (selectedEndpoint === 'POST') {
        let payload = {};
        try {
          payload = JSON.parse(requestBodyText);
        } catch (e) {
          responseCode = 400;
          responseStatusText = "Bad Request";
          errors.push("Invalid JSON body payload format.");
        }

        if (errors.length === 0) {
          // Schema Validation Rules Engine
          schema.fields.forEach(field => {
            if (field.key === 'id') return; // Skip auto ID
            const val = payload[field.key];

            if (field.required && (val === undefined || val === null || val === '')) {
              errors.push(`Field '${field.key}' is required.`);
            } else if (val !== undefined && val !== null) {
              if (field.type === 'number' && typeof val !== 'number') {
                errors.push(`Field '${field.key}' must be a valid number.`);
              }
              if (field.type === 'boolean' && typeof val !== 'boolean') {
                errors.push(`Field '${field.key}' must be boolean (true/false).`);
              }
              if (field.validation?.min !== undefined && field.validation.min !== null && val < field.validation.min) {
                errors.push(`Field '${field.key}' must be at least ${field.validation.min}.`);
              }
              if (field.validation?.enumValues && !field.validation.enumValues.includes(val)) {
                errors.push(`Field '${field.key}' must be one of: [${field.validation.enumValues.join(', ')}].`);
              }
            }
          });
        }

        if (errors.length > 0) {
          responseCode = 400;
          responseStatusText = "Bad Request (Validation Error)";
          bodyData = { success: false, statusCode: 400, errors };
        } else {
          // Auto-generate ID if missing
          const newId = payload.id || `${schema.entityName.toLowerCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
          const createdRecord = { id: newId, ...payload };
          
          setDbData(prev => [createdRecord, ...prev]);
          setRequestParamId(newId);

          responseCode = 201;
          responseStatusText = "Created";
          bodyData = {
            success: true,
            message: `${schema.entityName} created successfully`,
            data: createdRecord
          };
        }
      } 
      else if (selectedEndpoint === 'PUT') {
        if (!requestParamId) {
          responseCode = 400;
          responseStatusText = "Bad Request";
          bodyData = { success: false, error: "Missing path parameter ID" };
        } else {
          const existingIndex = dbData.findIndex(item => String(item.id) === String(requestParamId));
          if (existingIndex === -1) {
            responseCode = 404;
            responseStatusText = "Not Found";
            bodyData = { success: false, error: `${schema.entityName} with ID '${requestParamId}' does not exist.` };
          } else {
            let payload = {};
            try {
              payload = JSON.parse(requestBodyText);
            } catch (e) {
              errors.push("Invalid JSON payload format.");
            }

            if (errors.length > 0) {
              responseCode = 400;
              responseStatusText = "Bad Request";
              bodyData = { success: false, errors };
            } else {
              const updatedRecord = { ...dbData[existingIndex], ...payload, id: requestParamId };
              const updatedList = [...dbData];
              updatedList[existingIndex] = updatedRecord;
              setDbData(updatedList);

              responseCode = 200;
              responseStatusText = "OK";
              bodyData = {
                success: true,
                message: `${schema.entityName} ID '${requestParamId}' updated successfully`,
                data: updatedRecord
              };
            }
          }
        }
      } 
      else if (selectedEndpoint === 'DELETE') {
        if (!requestParamId) {
          responseCode = 400;
          responseStatusText = "Bad Request";
          bodyData = { success: false, error: "Missing ID to delete" };
        } else {
          const match = dbData.find(item => String(item.id) === String(requestParamId));
          if (!match) {
            responseCode = 404;
            responseStatusText = "Not Found";
            bodyData = { success: false, error: `Cannot delete. ${schema.entityName} with ID '${requestParamId}' not found.` };
          } else {
            setDbData(prev => prev.filter(item => String(item.id) !== String(requestParamId)));
            responseCode = 200;
            responseStatusText = "OK";
            bodyData = {
              success: true,
              message: `${schema.entityName} with ID '${requestParamId}' deleted successfully.`
            };
          }
        }
      }
    } catch (err) {
      responseCode = 500;
      responseStatusText = "Internal Server Error";
      bodyData = { success: false, error: err.message };
    }

    const endTime = performance.now();

    setLastResponse({
      statusCode: responseCode,
      statusText: responseStatusText,
      timeMs: Math.round(endTime - startTime + Math.random() * 8 + 4),
      timestamp: new Date().toLocaleTimeString(),
      data: bodyData
    });
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Generate Node.js Express Boilerplate Code
  const getExpressBoilerplate = () => {
    const fieldsList = schema.fields.map(f => `  // ${f.key}: ${f.type} (${f.required ? 'Required' : 'Optional'})`).join('\n');
    return `// Express.js REST API Server for ${schema.entityName} Management
// Generated by AI Backend Builder

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-Memory Database Store
let database = ${JSON.stringify(dbData, null, 2)};

/* 
  Data Model Rules for ${schema.entityName}:
${fieldsList}
*/

// 1. GET ALL ${schema.entityName.toUpperCase()}S
app.get('${schema.endpointBase}', (req, res) => {
  res.status(200).json({
    success: true,
    count: database.length,
    data: database
  });
});

// 2. GET SINGLE ${schema.entityName.toUpperCase()} BY ID
app.get('${schema.endpointBase}/:id', (req, res) => {
  const { id } = req.params;
  const item = database.find(r => String(r.id) === String(id));
  
  if (!item) {
    return res.status(404).json({ success: false, error: '${schema.entityName} not found' });
  }
  
  res.status(200).json({ success: true, data: item });
});

// 3. CREATE NEW ${schema.entityName.toUpperCase()}
app.post('${schema.endpointBase}', (req, res) => {
  const payload = req.body;
  
  // Validation Check
  const requiredFields = ${JSON.stringify(schema.fields.filter(f => f.required && f.key !== 'id').map(f => f.key))};
  const missing = requiredFields.filter(field => payload[field] === undefined || payload[field] === '');
  
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      missingFields: missing
    });
  }

  const newRecord = {
    id: payload.id || \`${schema.entityName.toLowerCase().slice(0, 3)}-\${Date.now()}\`,
    ...payload
  };

  database.unshift(newRecord);
  res.status(201).json({
    success: true,
    message: '${schema.entityName} created successfully',
    data: newRecord
  });
});

// 4. UPDATE ${schema.entityName.toUpperCase()} BY ID
app.put('${schema.endpointBase}/:id', (req, res) => {
  const { id } = req.params;
  const index = database.findIndex(r => String(r.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ success: false, error: '${schema.entityName} not found' });
  }

  database[index] = { ...database[index], ...req.body, id };
  res.status(200).json({
    success: true,
    message: '${schema.entityName} updated successfully',
    data: database[index]
  });
});

// 5. DELETE ${schema.entityName.toUpperCase()} BY ID
app.delete('${schema.endpointBase}/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = database.length;
  database = database.filter(r => String(r.id) !== String(id));

  if (database.length === initialLength) {
    return res.status(404).json({ success: false, error: '${schema.entityName} not found' });
  }

  res.status(200).json({
    success: true,
    message: '${schema.entityName} deleted successfully'
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
  console.log(\`📡 Base API Endpoint: http://localhost:\${PORT}${schema.endpointBase}\`);
});
`;
  };

  // Helper code snippets for Tab 3
  const getCurlSnippet = (method) => {
    const base = `http://localhost:3000${schema.endpointBase}`;
    if (method === 'GET_ALL') return `curl -X GET "${base}" -H "Accept: application/json"`;
    if (method === 'GET_BY_ID') return `curl -X GET "${base}/${requestParamId || 'id-001'}" -H "Accept: application/json"`;
    if (method === 'POST') return `curl -X POST "${base}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyText.replace(/\n/g, '')}'`;
    if (method === 'PUT') return `curl -X PUT "${base}/${requestParamId || 'id-001'}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyText.replace(/\n/g, '')}'`;
    if (method === 'DELETE') return `curl -X DELETE "${base}/${requestParamId || 'id-001'}"`;
    return '';
  };

  const getJsSnippet = (method) => {
    const url = `http://localhost:3000${schema.endpointBase}`;
    if (method === 'GET_ALL') {
      return `fetch('${url}')\n  .then(res => res.json())\n  .then(data => console.log(data));`;
    }
    if (method === 'POST') {
      return `fetch('${url}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${requestBodyText.replace(/\n\s*/g, ' ')})\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`;
    }
    return `// JavaScript Fetch for ${method}\nfetch('${url}/${requestParamId || 'id-001'}', { method: '${method === 'DELETE' ? 'DELETE' : 'GET'}' })\n  .then(res => res.json());`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">VibeAPI Builder</h1>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                AI Backend Generator
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Instant REST APIs, Schema Validation, & Live Browser Playground</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-md border border-slate-700/50">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mock Engine: <strong className="text-emerald-400 font-mono">In-Memory Active</strong></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">

        {/* Section 1: Natural Language Prompt Engine */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Terminal className="w-48 h-48 text-indigo-400" />
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            <label className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Describe Your Data & Business Requirement
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-950 border border-slate-700/70 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 transition font-medium"
                placeholder="e.g., Build an API for Employee Management with Employee Name, Department, Joining Date..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSchema(prompt)}
              />
              <button 
                onClick={() => handleGenerateSchema(prompt)}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing Schema...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate API</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-400 font-medium">Quick Prompts:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                    handleGenerateSchema(p.prompt);
                  }}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-md px-2.5 py-1 transition cursor-pointer"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Main Workspace Workspace Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'playground' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>API Playground</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                {dbData.length} records
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'schema' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Data Model & Validation</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'docs' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>API Docs & cURL</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'export' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Express.js Code Export</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono hidden md:block">
            Base Path: <span className="text-slate-300">{schema.endpointBase}</span>
          </div>
        </div>

        {/* Tab 1: DATA MODEL & SCHEMA */}
        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Field List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">{schema.entityName} Schema Model</h3>
                  <p className="text-xs text-slate-400">{schema.description}</p>
                </div>
                <span className="text-xs bg-slate-800 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded font-mono">
                  {schema.fields.length} Fields Defined
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-mono">
                      <th className="py-2.5 px-3">Field Key</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Required</th>
                      <th className="py-2.5 px-3">Validation Rules</th>
                      <th className="py-2.5 px-3">Default Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {schema.fields.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-semibold text-indigo-300">{f.key}</td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {f.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {f.required ? (
                            <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/20">
                              YES
                            </span>
                          ) : (
                            <span className="text-slate-500">Optional</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {f.validation?.enumValues ? (
                            <span>Enum: [{f.validation.enumValues.join(', ')}]</span>
                          ) : f.validation?.min !== undefined && f.validation?.min !== null ? (
                            <span>min: {f.validation.min}</span>
                          ) : f.validation?.pattern ? (
                            <span>pattern: {f.validation.pattern}</span>
                          ) : (
                            <span className="text-slate-600">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {String(f.defaultValue ?? '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generated Raw JSON Schema */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-400 uppercase">JSON Schema Output</span>
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(schema, null, 2), 'schema_json')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'schema_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'schema_json' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3.5 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto h-96">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: INTERACTIVE API PLAYGROUND */}
        {activeTab === 'playground' && (
          <div className="flex flex-col gap-4">

            {/* Sub-toggle: Tester vs Database Inspector */}
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePlaygroundSubTab('tester')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    activePlaygroundSubTab === 'tester' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Postman Style Request Tester
                </button>
                <button
                  onClick={() => setActivePlaygroundSubTab('dbState')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activePlaygroundSubTab === 'dbState' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Live DB State ({dbData.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDbData(schema.seedData || generateFallbackSchema(prompt).seedData)}
                  className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700/60 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                  title="Reset DB to initial seed records"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Seed Data</span>
                </button>
              </div>
            </div>

            {activePlaygroundSubTab === 'tester' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Endpoints Navigation & Input Form */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Endpoint Switcher Buttons */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase px-1">Select Endpoint Operation</span>
                    
                    <button
                      onClick={() => setSelectedEndpoint('GET_ALL')}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                        selectedEndpoint === 'GET_ALL' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span>
                        <span>List All Records</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{schema.endpointBase}</span>
                    </button>

                    <button
                      onClick={() => setSelectedEndpoint('GET_BY_ID')}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                        selectedEndpoint === 'GET_BY_ID' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">GET</span>
                        <span>Get Record By ID</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{schema.endpointBase}/:id</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEndpoint('POST');
                        prepareRequestBody(schema, 'POST');
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                        selectedEndpoint === 'POST' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">POST</span>
                        <span>Create New Record</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{schema.endpointBase}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEndpoint('PUT');
                        const record = dbData.find(d => String(d.id) === String(requestParamId)) || dbData[0];
                        prepareRequestBody(schema, 'PUT', record);
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                        selectedEndpoint === 'PUT' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">PUT</span>
                        <span>Update Existing Record</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{schema.endpointBase}/:id</span>
                    </button>

                    <button
                      onClick={() => setSelectedEndpoint('DELETE')}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                        selectedEndpoint === 'DELETE' ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold">DELETE</span>
                        <span>Delete Record</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{schema.endpointBase}/:id</span>
                    </button>
                  </div>

                  {/* URL Bar & Parameter Configurator */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <span className="text-xs font-mono text-slate-400 uppercase">HTTP URL Constructor</span>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                        selectedEndpoint.startsWith('GET') ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedEndpoint === 'POST' ? 'bg-amber-500/20 text-amber-400' :
                        selectedEndpoint === 'PUT' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {selectedEndpoint === 'GET_ALL' || selectedEndpoint === 'GET_BY_ID' ? 'GET' : selectedEndpoint}
                      </span>
                      
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 overflow-x-auto whitespace-nowrap">
                        {schema.endpointBase}
                        {(selectedEndpoint === 'GET_BY_ID' || selectedEndpoint === 'PUT' || selectedEndpoint === 'DELETE') && (
                          <span className="text-indigo-400">/{requestParamId || ':id'}</span>
                        )}
                      </div>
                    </div>

                    {/* ID Path Parameter selector */}
                    {(selectedEndpoint === 'GET_BY_ID' || selectedEndpoint === 'PUT' || selectedEndpoint === 'DELETE') && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="text-xs text-slate-400">Path Parameter (<code className="text-indigo-300">id</code>):</label>
                        <div className="flex gap-2">
                          <select 
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-200"
                            value={requestParamId}
                            onChange={(e) => setRequestParamId(e.target.value)}
                          >
                            {dbData.map(item => (
                              <option key={item.id} value={item.id}>
                                ID: {item.id} - ({item[schema.fields[1]?.key] || 'Record'})
                              </option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono"
                            placeholder="Custom ID..."
                            value={requestParamId}
                            onChange={(e) => setRequestParamId(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Request Payload Editor (POST / PUT) */}
                    {(selectedEndpoint === 'POST' || selectedEndpoint === 'PUT') && (
                      <div className="flex flex-col gap-1.5 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-400 font-mono">Request JSON Body:</label>
                          <button 
                            onClick={() => prepareRequestBody(schema, selectedEndpoint)}
                            className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                          >
                            Reset Payload
                          </button>
                        </div>
                        <textarea
                          rows={7}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          value={requestBodyText}
                          onChange={(e) => setRequestBodyText(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Execute Request Trigger Button */}
                    <button
                      onClick={handleExecuteRequest}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Live Test Request</span>
                    </button>
                  </div>

                </div>

                {/* Right Side: Response Inspector */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 min-h-[460px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-semibold text-sm text-slate-100">HTTP Response Inspector</h3>
                      </div>

                      {lastResponse && (
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                            lastResponse.statusCode >= 200 && lastResponse.statusCode < 300 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {lastResponse.statusCode} {lastResponse.statusText}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ⏱️ {lastResponse.timeMs} ms
                          </span>
                        </div>
                      )}
                    </div>

                    {lastResponse ? (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span>Response Headers: <span className="text-slate-300">Content-Type: application/json</span></span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(lastResponse.data, null, 2), 'response_json')}
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'response_json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'response_json' ? 'Copied' : 'Copy Body'}</span>
                          </button>
                        </div>

                        <pre className="flex-1 bg-slate-950 p-4 rounded-lg text-xs font-mono border border-slate-800 overflow-x-auto text-emerald-400">
                          {JSON.stringify(lastResponse.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 gap-2 border border-dashed border-slate-800 rounded-lg">
                        <Play className="w-8 h-8 opacity-40 text-indigo-400" />
                        <p className="text-sm font-medium text-slate-400">No Request Sent Yet</p>
                        <p className="text-xs max-w-sm">Select an operation on the left panel and click "Send Live Test Request" to execute against in-memory storage.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Subtab: Live Database State Inspector */
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Live In-Memory Database ({dbData.length} Records)</span>
                    </h3>
                    <p className="text-xs text-slate-400">Real-time state of your mock collection. Modifications via API playground reflect immediately here.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newId = `${schema.entityName.toLowerCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
                      const mockNew = { id: newId };
                      schema.fields.forEach(f => {
                        if (f.key !== 'id') mockNew[f.key] = f.defaultValue;
                      });
                      setDbData([mockNew, ...dbData]);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Add Seed Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase">
                        {schema.fields.map((f, i) => (
                          <th key={i} className="py-2.5 px-3">{f.label} ({f.key})</th>
                        ))}
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {dbData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {schema.fields.map((f, fi) => (
                            <td key={fi} className="py-2.5 px-3 text-slate-200">
                              {typeof row[f.key] === 'boolean' 
                                ? (row[f.key] ? 'true' : 'false') 
                                : String(row[f.key] ?? '')}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setDbData(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 3: API DOCUMENTATION & CURL */}
        {activeTab === 'docs' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-semibold text-lg text-slate-100">{schema.entityName} API Specification Documentation</h3>
                <p className="text-xs text-slate-400">OpenAPI 3.0 standard endpoints and executable client integration snippets.</p>
              </div>

              {/* Endpoints Doc Grid */}
              <div className="flex flex-col gap-4">
                
                {/* Endpoint 1 */}
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded text-xs font-bold font-mono">GET</span>
                      <code className="text-xs font-mono text-slate-100">{schema.endpointBase}</code>
                    </div>
                    <span className="text-xs text-slate-400">Fetch collection</span>
                  </div>
                  <p className="text-xs text-slate-300">Retrieves all records from the {schema.entityName} collection.</p>
                  
                  <div className="bg-slate-900 p-3 rounded font-mono text-xs flex justify-between items-center text-slate-300">
                    <code>{getCurlSnippet('GET_ALL')}</code>
                    <button onClick={() => copyToClipboard(getCurlSnippet('GET_ALL'), 'c1')} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      {copiedKey === 'c1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Endpoint 2 */}
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded text-xs font-bold font-mono">POST</span>
                      <code className="text-xs font-mono text-slate-100">{schema.endpointBase}</code>
                    </div>
                    <span className="text-xs text-slate-400">Create record</span>
                  </div>
                  <p className="text-xs text-slate-300">Validates schema payload and creates a new {schema.entityName} entity.</p>
                  
                  <div className="bg-slate-900 p-3 rounded font-mono text-xs flex justify-between items-center text-slate-300">
                    <code className="whitespace-pre-wrap">{getCurlSnippet('POST')}</code>
                    <button onClick={() => copyToClipboard(getCurlSnippet('POST'), 'c2')} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      {copiedKey === 'c2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Endpoint 3 */}
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded text-xs font-bold font-mono">PUT</span>
                      <code className="text-xs font-mono text-slate-100">{schema.endpointBase}/:id</code>
                    </div>
                    <span className="text-xs text-slate-400">Update record</span>
                  </div>
                  <p className="text-xs text-slate-300">Modifies fields for an existing record by ID.</p>
                  
                  <div className="bg-slate-900 p-3 rounded font-mono text-xs flex justify-between items-center text-slate-300">
                    <code>{getCurlSnippet('PUT')}</code>
                    <button onClick={() => copyToClipboard(getCurlSnippet('PUT'), 'c3')} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      {copiedKey === 'c3' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Endpoint 4 */}
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded text-xs font-bold font-mono">DELETE</span>
                      <code className="text-xs font-mono text-slate-100">{schema.endpointBase}/:id</code>
                    </div>
                    <span className="text-xs text-slate-400">Remove record</span>
                  </div>
                  <p className="text-xs text-slate-300">Deletes the entity matching the specified path ID.</p>
                  
                  <div className="bg-slate-900 p-3 rounded font-mono text-xs flex justify-between items-center text-slate-300">
                    <code>{getCurlSnippet('DELETE')}</code>
                    <button onClick={() => copyToClipboard(getCurlSnippet('DELETE'), 'c4')} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      {copiedKey === 'c4' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 4: EXPORT NODE.JS EXPRESS BOILERPLATE */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">Node.js Express Server Boilerplate</h3>
                  <p className="text-xs text-slate-400">Standalone Express app preconfigured with CORS, routes, validation, and seed data.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(getExpressBoilerplate(), 'express_code')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    {copiedKey === 'express_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'express_code' ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
                <pre>{getExpressBoilerplate()}</pre>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-4 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[11px]">How to Run Locally:</span>
                <ol className="list-decimal list-inside space-y-1 font-mono text-slate-400">
                  <li>Save code as <code className="text-indigo-300">server.js</code></li>
                  <li>Run terminal command: <code className="text-emerald-400">npm init -y && npm i express cors</code></li>
                  <li>Start server: <code className="text-emerald-400">node server.js</code></li>
                  <li>Test API at <code className="text-indigo-300">http://localhost:3000{schema.endpointBase}</code></li>
                </ol>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}