// Tee Times Lambda Function
// Handles CRUD operations for tee times

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TEE_TIMES_TABLE = process.env.TEE_TIMES_TABLE;
const PLAYGROUPS_TABLE = process.env.PLAYGROUPS_TABLE;
const COURSES_TABLE = process.env.COURSES_TABLE;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    
    // Extract user info from Cognito claims
    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub;
    const userEmail = claims?.email;
    const userGroups = claims?.['cognito:groups'] ? claims['cognito:groups'].split(',') : [];

    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    let response;

    switch (httpMethod) {
      case 'GET':
        response = await getTeeTimes(userId, userGroups, event.queryStringParameters);
        break;
      case 'POST':
        response = await createTeeTime(JSON.parse(event.body), userId, userEmail, userGroups);
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    return {
      ...response,
      headers: { ...corsHeaders, ...response.headers }
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function getTeeTimes(userId, userGroups, queryParams) {
  try {
    const playgroupId = queryParams?.playgroupId;
    const date = queryParams?.date;

    if (playgroupId) {
      // Get tee times for specific playgroup
      const params = {
        TableName: TEE_TIMES_TABLE,
        IndexName: 'playgroup-index',
        KeyConditionExpression: 'playgroupId = :playgroupId',
        ExpressionAttributeValues: {
          ':playgroupId': playgroupId
        }
      };

      if (date) {
        params.KeyConditionExpression += ' AND #date = :date';
        params.ExpressionAttributeNames = { '#date': 'date' };
        params.ExpressionAttributeValues[':date'] = date;
      }

      const result = await dynamodb.query(params).promise();
      
      // Filter for INFO records only
      const teeTimes = result.Items.filter(item => item.type === 'INFO');

      return {
        statusCode: 200,
        body: JSON.stringify({
          teeTimes: teeTimes,
          total: teeTimes.length
        })
      };
    }

    // If no specific playgroup, get all tee times user has access to
    // This requires getting user's playgroups first
    const userPlaygroups = await getUserPlaygroups(userId, userGroups);
    const playgroupIds = userPlaygroups.map(pg => pg.playgroupId);

    if (playgroupIds.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          teeTimes: [],
          total: 0
        })
      };
    }

    // Get tee times for all user's playgroups
    const promises = playgroupIds.map(async (pgId) => {
      const params = {
        TableName: TEE_TIMES_TABLE,
        IndexName: 'playgroup-index',
        KeyConditionExpression: 'playgroupId = :playgroupId',
        ExpressionAttributeValues: {
          ':playgroupId': pgId
        }
      };

      const result = await dynamodb.query(params).promise();
      return result.Items.filter(item => item.type === 'INFO');
    });

    const results = await Promise.all(promises);
    const allTeeTimes = results.flat();

    // Sort by date and time
    allTeeTimes.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        teeTimes: allTeeTimes,
        total: allTeeTimes.length
      })
    };

  } catch (error) {
    console.error('Error getting tee times:', error);
    throw error;
  }
}

async function createTeeTime(data, userId, userEmail, userGroups) {
  try {
    const { playgroupId, courseId, date, time, description, maxPlayers = 4 } = data;

    // Validate required fields
    if (!playgroupId || !courseId || !date || !time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: playgroupId, courseId, date, time' 
        })
      };
    }

    // Verify user has permission to create tee times for this playgroup
    const hasPermission = await verifyPlaygroupPermission(userId, playgroupId, userGroups);
    if (!hasPermission) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Insufficient permissions to create tee time for this playgroup' 
        })
      };
    }

    const teeTimeId = `tt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const timestamp = new Date().toISOString();

    // Create tee time record
    const teeTimeInfo = {
      teeTimeId,
      type: 'INFO',
      playgroupId,
      courseId,
      date,
      time,
      description: description?.trim() || '',
      maxPlayers: parseInt(maxPlayers) || 4,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'SCHEDULED',
      currentPlayers: 0
    };

    const params = {
      TableName: TEE_TIMES_TABLE,
      Item: teeTimeInfo
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Tee time created successfully',
        teeTime: teeTimeInfo
      })
    };

  } catch (error) {
    console.error('Error creating tee time:', error);
    throw error;
  }
}

async function getUserPlaygroups(userId, userGroups) {
  try {
    if (userGroups.includes('Admin')) {
      // Admins can see all playgroups
      const params = {
        TableName: PLAYGROUPS_TABLE,
        FilterExpression: '#type = :infoType',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':infoType': 'INFO'
        }
      };
      
      const result = await dynamodb.scan(params).promise();
      return result.Items;
    }

    // Get playgroups where user is leader or member
    const leaderParams = {
      TableName: PLAYGROUPS_TABLE,
      IndexName: 'leader-index',
      KeyConditionExpression: 'leaderId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const memberParams = {
      TableName: PLAYGROUPS_TABLE,
      IndexName: 'member-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const [leaderResult, memberResult] = await Promise.all([
      dynamodb.query(leaderParams).promise(),
      dynamodb.query(memberParams).promise()
    ]);

    const playgroupIds = new Set();
    const playgroups = [];

    leaderResult.Items.forEach(item => {
      if (item.type === 'INFO') {
        playgroupIds.add(item.playgroupId);
        playgroups.push(item);
      }
    });

    memberResult.Items.forEach(item => {
      if (item.type === 'INFO' && !playgroupIds.has(item.playgroupId)) {
        playgroups.push(item);
      }
    });

    return playgroups;

  } catch (error) {
    console.error('Error getting user playgroups:', error);
    throw error;
  }
}

async function verifyPlaygroupPermission(userId, playgroupId, userGroups) {
  try {
    // Admins can create tee times for any playgroup
    if (userGroups.includes('Admin')) {
      return true;
    }

    // Check if user is leader of the playgroup
    const params = {
      TableName: PLAYGROUPS_TABLE,
      Key: {
        playgroupId,
        type: 'INFO'
      }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return false; // Playgroup doesn't exist
    }

    // User must be the leader to create tee times
    return result.Item.leaderId === userId;

  } catch (error) {
    console.error('Error verifying playgroup permission:', error);
    return false;
  }
}