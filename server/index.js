const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { format, startOfDay, endOfDay, subDays } = require('date-fns');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3011;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Load API key from .env file
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log("Using API Key:", process.env.API_KEY);

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'AnomalyDetector';
let db;

// Connect to MongoDB
MongoClient.connect(mongoURI, {})
    .then((client) => {
        db = client.db(dbName);
        console.log(`Connected to MongoDB: ${dbName}`);
    })
    .catch((err) => console.error('MongoDB connection error:', err));


// Helper: Get Super Timestamp
function getSuperTimestamp() {
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
}
    

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Step 1: Analyze user query with Gemini AI
        const aiResult = await model.generateContent(`
            Analyze the following user query and determine the action required.
            Possible actions: 
            - "COUNT_ATTACKS"
            - "FETCH_LOGS"
            - "MOST_FREQUENT_ATTACK"
            - "ATTACK_TRENDS"
            - "COMPARISON_STATS"
            - "ANOMALY_DETECTION"
            - "UNKNOWN"
            Provide only the action in your response.
            Query: "${prompt}"
        `);

        const action = aiResult.response.text().trim();
        console.log('AI Classified Action:', action);

        // Step 2: Perform the appropriate action
        let responseContent = ''; // To store the final AI-generated response

        if (action === 'COUNT_ATTACKS') {
            // Count today's attacks using the updated date format
            const now = new Date();
            const startOfToday = format(startOfDay(now), 'yyyy-MM-dd HH:mm:ss');
            const endOfToday = format(endOfDay(now), 'yyyy-MM-dd HH:mm:ss');

            console.log('Start of Day:', startOfToday);
            console.log('End of Day:', endOfToday);

            const count = await db.collection('maliciousactions').countDocuments({
                date: { $gte: startOfToday, $lte: endOfToday },
            });

            console.log('Count Query Result:', count);

            const conversationalResponse = await model.generateContent(`
                Based on the data provided, generate a conversational reply:
                Data: "Today, we detected ${count} malicious actions."
                The response should be natural and conversational.
            `);

            responseContent = conversationalResponse.response.text().trim();
        } else if (action === 'FETCH_LOGS') {
            // Fetch recent logs
            const logs = await db.collection('maliciousactions').find().sort({ date: -1 }).limit(100).toArray();
            const conversationalResponse = await model.generateContent(`
                Based on the data provided, generate a summary of recent logs:
                Data: ${JSON.stringify(logs)}
                The response should provide insights in a natural and conversational tone.
            `);

            responseContent = conversationalResponse.response.text().trim();
        } else if (action === 'MOST_FREQUENT_ATTACK') {
            // Find the most frequent attack
            const result = await db.collection('maliciousactions').aggregate([
                { $group: { _id: '$query', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]).toArray();

            if (result.length > 0) {
                const query = result[0]._id;
                const count = result[0].count;

                const conversationalResponse = await model.generateContent(`
                    Based on the data provided, generate a conversational response:
                    Data: "The most common attack is '${query}', which occurred ${count} times."
                    The response should be insightful and natural.
                `);

                responseContent = conversationalResponse.response.text().trim();
            } else {
                responseContent = 'No attacks logged yet.';
            }
        } else if (action === 'ATTACK_TRENDS') {
            // Analyze attack trends over the past 7 days
            const now = new Date();
            const pastWeekStart = format(subDays(startOfDay(now), 7), 'yyyy-MM-dd HH:mm:ss');
            const pastWeekEnd = format(endOfDay(now), 'yyyy-MM-dd HH:mm:ss');

            const trends = await db.collection('maliciousactions').aggregate([
                { $match: { date: { $gte: pastWeekStart, $lte: pastWeekEnd } } },
                { $group: { _id: { $substr: ['$date', 0, 10] }, count: { $sum: 1 } } }, // Group by day
                { $sort: { _id: 1 } },
            ]).toArray();

            const conversationalResponse = await model.generateContent(`
                Based on the data provided, generate a conversational response:
                Data: "Attack trends over the past 7 days: ${JSON.stringify(trends)}"
                The response should highlight trends and key insights.
            `);

            responseContent = conversationalResponse.response.text().trim();
        } else if (action === 'COMPARISON_STATS') {
            // Compare attack stats between two date ranges
            const now = new Date();
            const startOfCurrentWeek = format(startOfDay(now), 'yyyy-MM-dd HH:mm:ss');
            const startOfLastWeek = format(subDays(startOfDay(now), 7), 'yyyy-MM-dd HH:mm:ss');
            const endOfLastWeek = format(subDays(endOfDay(now), 7), 'yyyy-MM-dd HH:mm:ss');

            const currentWeekCount = await db.collection('maliciousactions').countDocuments({
                date: { $gte: startOfCurrentWeek, $lte: endOfToday },
            });

            const lastWeekCount = await db.collection('maliciousactions').countDocuments({
                date: { $gte: startOfLastWeek, $lte: endOfLastWeek },
            });

            const conversationalResponse = await model.generateContent(`
                Based on the data provided, generate a comparative response:
                Data: "Current week: ${currentWeekCount}, Last week: ${lastWeekCount}"
                The response should highlight the difference in attack patterns between the two weeks.
            `);

            responseContent = conversationalResponse.response.text().trim();
        } else if (action === 'ANOMALY_DETECTION') {
            // Detect anomalies in attack patterns
            const anomalyThreshold = 10; // Example threshold for anomaly detection
            const anomalies = await db.collection('maliciousactions').aggregate([
                { $group: { _id: '$query', count: { $sum: 1 } } },
                { $match: { count: { $gt: anomalyThreshold } } },
            ]).toArray();

            const conversationalResponse = await model.generateContent(`
                Based on the data provided, generate a response for anomalies detected:
                Data: "Anomalies detected: ${JSON.stringify(anomalies)}"
                The response should explain the anomalies clearly.
            `);

            responseContent = conversationalResponse.response.text().trim();
        } else {
            // Handle unknown actions
            responseContent = "I'm not sure how to process your request. Could you clarify your question?";
        }

        // Return the final conversational response
        return res.json({ action, response: responseContent });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


// Helper: Check Query Safety
async function checkQuerySafety(query) {
    const prompt = `
Analyze the following query and determine if it is malicious or safe for execution. Respond with "SAFE" or "MALICIOUS":
Query: ${query}
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Error analyzing query:', error);
        throw new Error('Failed to analyze query safety.');
    }
}

// Helper: Check Query Safety
async function executeQueryInMongoDB(query) {
    try {
        if (query.toLowerCase().startsWith('select')) {
            // Extract collection name and WHERE clause
            const collectionName = query.match(/from\s+(\w+)/i)?.[1]; // Extract collection name
            const whereClause = query.match(/where\s+(.+)/i)?.[1]; // Extract WHERE clause

            if (!collectionName) {
                throw new Error('Invalid SELECT query: missing collection name.');
            }

            // Convert WHERE clause into MongoDB filter object
            let filter = {};

            if (whereClause) {
                const comparisonMatches = whereClause.match(/(\w+)\s*(>|<|>=|<=|!=|=)\s*([\d"']+)/g);
                if (comparisonMatches) {
                    comparisonMatches.forEach((match) => {
                        const [_, key, operator, value] = match.match(/(\w+)\s*(>|<|>=|<=|!=|=)\s*([\d"']+)/);
                        const parsedValue = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);

                        // Map SQL comparison operators to MongoDB operators
                        if (!filter.$and) filter.$and = [];
                        filter.$and.push({
                            [key]: {
                                [operator === '>' ? '$gt'
                                    : operator === '<' ? '$lt'
                                        : operator === '>=' ? '$gte'
                                            : operator === '<=' ? '$lte'
                                                : operator === '!=' ? '$ne'
                                                    : '$eq']: parsedValue,
                            },
                        });
                    });
                } else {
                    // For basic equality checks without operators
                    whereClause.split('and').forEach((condition) => {
                        const [key, value] = condition.split('=').map((s) => s.trim());
                        if (key && value) {
                            filter[key] = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);
                        }
                    });
                }
            }

            console.log('Generated Filter:', JSON.stringify(filter, null, 2));

            // Fetch data from MongoDB collection
            const data = await db.collection(collectionName).find(filter).toArray();
            console.log('Query Result:', data);
            return data;
        } else if (query.toLowerCase().startsWith('insert')) {
            // Handle INSERT queries
            const collectionName = query.match(/into\s+(\w+)/i)?.[1];
            const valuesClause = query.match(/values\s*\((.+)\)/i)?.[1];

            if (!collectionName || !valuesClause) {
                throw new Error('Invalid INSERT query: missing collection name or VALUES clause.');
            }

            // Parse VALUES clause into an object
            const fields = valuesClause.split(',').map((value) => value.trim().replace(/['"]/g, ''));
            const data = fields.reduce((acc, value, index) => {
                acc[`field${index + 1}`] = value; // Example: Dynamic fields
                return acc;
            }, {});

            // Insert into MongoDB
            return await db.collection(collectionName).insertOne(data);
        } else if (query.toLowerCase().startsWith('update')) {
            // Handle UPDATE queries
            const collectionName = query.match(/update\s+(\w+)/i)?.[1];
            const setClause = query.match(/set\s+(.+?)\s+where/i)?.[1];
            const whereClause = query.match(/where\s+(.+)/i)?.[1];

            if (!collectionName || !setClause || !whereClause) {
                throw new Error('Invalid UPDATE query: missing collection name, SET clause, or WHERE clause.');
            }

            // Convert SET clause into MongoDB update object
            const setFields = setClause.split(',').reduce((acc, item) => {
                const [key, value] = item.split('=').map((s) => s.trim());
                acc[key] = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);
                return acc;
            }, {});

            // Convert WHERE clause into MongoDB filter object
            const whereFields = whereClause.split('and').reduce((acc, item) => {
                const [key, value] = item.split('=').map((s) => s.trim());
                acc[key] = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);
                return acc;
            }, {});

            // Perform the update in MongoDB
            return await db.collection(collectionName).updateMany(whereFields, { $set: setFields });
        } else if (query.toLowerCase().startsWith('delete')) {
            // Handle DELETE queries
            const collectionName = query.match(/from\s+(\w+)/i)?.[1];
            const whereClause = query.match(/where\s+(.+)/i)?.[1];

            if (!collectionName || !whereClause) {
                throw new Error('Invalid DELETE query: missing collection name or WHERE clause.');
            }

            // Convert WHERE clause into MongoDB filter object
            const whereFields = whereClause.split('and').reduce((acc, item) => {
                const [key, value] = item.split('=').map((s) => s.trim());
                acc[key] = isNaN(value) ? value.replace(/['"]/g, '') : parseFloat(value);
                return acc;
            }, {});

            // Perform the delete operation
            return await db.collection(collectionName).deleteMany(whereFields);
        } else {
            throw new Error('Unsupported query type.');
        }
    } catch (error) {
        console.error('Error parsing or executing query:', error);
        throw new Error('Query execution failed.');
    }
}


app.post('/api/process-query', async (req, res) => {
    try {
        const { query } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log('Received query:', query);

        const analysis = await checkQuerySafety(query);
        console.log('Query analysis result:', analysis);

        const timestamp = getSuperTimestamp(); // Use the updated timestamp format

        if (analysis === 'MALICIOUS') {
            const maliciousEntry = {
                query,
                date: timestamp,
                ip,
            };

            await db.collection('maliciousactions').insertOne(maliciousEntry);

            return res.status(403).json({
                result: 'The query is malicious and has been blocked.',
                query,
                analysis,
                timestamp,
                ip,
            });
        }

        const queryResult = await executeQueryInMongoDB(query);

        return res.json({
            result: 'The query is safe to execute.',
            query,
            analysis,
            queryResult,
            timestamp,
            ip,
        });
    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({ error: error.message || 'Internal server error.' });
    }
});




app.get('/api/malicious-logs', async (req, res) => {
    try {
        const now = new Date();

        // Format start and end of the day as strings
        const startOfToday = format(startOfDay(now), 'yyyy-MM-dd HH:mm:ss');
        const endOfToday = format(endOfDay(now), 'yyyy-MM-dd HH:mm:ss');


        // Count today's attacks based on string comparison
        const todayAttacks = await db.collection('maliciousactions').countDocuments({
            date: { $gte: startOfToday, $lte: endOfToday },
        });

        // Fetch all logs for display
        const logs = await db.collection('maliciousactions').find({}).toArray();

        res.status(200).json({
            todayAttacks,
            maliciousQueries: logs,
        });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({
            error: error.message || 'An error occurred while retrieving logs.',
        });
    }
});

// Test Route
app.get('/', (req, res) => {
    res.send('Welcome to the backend!');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
