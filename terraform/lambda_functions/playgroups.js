// Playgroups Lambda Function
// Handles CRUD operations for playgroups

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PLAYGROUPS_TABLE = process.env.PLAYGROUPS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

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
    const path = event.path;
    
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
        response = await getPlaygroups(userId, userGroups);
        break;
      case 'POST':
        response = await createPlaygroup(JSON.parse(event.body), userId, userEmail);
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

async function getPlaygroups(userId, userGroups) {
  try {
    // If user is Admin, get all playgroups
    if (userGroups.includes('Admin')) {
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
      return {
        statusCode: 200,
        body: JSON.stringify({
          playgroups: result.Items,
          total: result.Count
        })
      };
    }

    // For regular users, get playgroups they're a member of or leading
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

    // Combine and deduplicate results
    const playgroupIds = new Set();
    const playgroups = [];

    // Add playgroups where user is leader
    leaderResult.Items.forEach(item => {
      if (item.type === 'INFO') {
        playgroupIds.add(item.playgroupId);
        playgroups.push(item);
      }
    });

    // Add playgroups where user is member
    memberResult.Items.forEach(item => {
      if (item.type === 'INFO' && !playgroupIds.has(item.playgroupId)) {
        playgroups.push(item);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        playgroups: playgroups,
        total: playgroups.length
      })
    };

  } catch (error) {
    console.error('Error getting playgroups:', error);
    throw error;
  }
}

async function createPlaygroup(data, userId, userEmail) {
  try {
    const { name, description } = data;

    if (!name || !name.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Playgroup name is required' })
      };
    }

    const playgroupId = `pg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const timestamp = new Date().toISOString();

    // Create playgroup info record
    const playgroupInfo = {
      playgroupId,
      type: 'INFO',
      name: name.trim(),
      description: description?.trim() || '',
      leaderId: userId,
      leaderEmail: userEmail,
      createdAt: timestamp,
      updatedAt: timestamp,
      memberCount: 1,
      status: 'ACTIVE'
    };

    // Create leader membership record
    const leaderMembership = {
      playgroupId,
      type: `MEMBER:${userId}`,
      userId,
      userEmail,
      role: 'LEADER',
      joinedAt: timestamp,
      status: 'ACTIVE'
    };

    // Write both records in a transaction
    const transactParams = {
      TransactItems: [
        {
          Put: {
            TableName: PLAYGROUPS_TABLE,
            Item: playgroupInfo
          }
        },
        {
          Put: {
            TableName: PLAYGROUPS_TABLE,
            Item: leaderMembership
          }
        }
      ]
    };

    await dynamodb.transactWrite(transactParams).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Playgroup created successfully',
        playgroup: playgroupInfo
      })
    };

  } catch (error) {
    console.error('Error creating playgroup:', error);
    throw error;
  }
}