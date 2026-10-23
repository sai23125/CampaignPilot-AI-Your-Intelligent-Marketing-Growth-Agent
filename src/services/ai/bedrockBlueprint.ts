/**
 * AWS Builder Mini Challenge Architecture Specification & Blueprint.
 * 
 * This module defines the architecture and integration guide for migrating or
 * dual-homing CampaignPilot AI onto Amazon Web Services (AWS Bedrock, DynamoDB, S3).
 * 
 * Status: READY_FOR_AWS_INTEGRATION (Blueprint & Code Adapters Complete)
 */

export const AWS_BEDROCK_BLUEPRINT = {
  serviceName: 'Amazon Bedrock Campaign Diagnosis Service',
  supportedModels: [
    {
      modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      name: 'Anthropic Claude 3.5 Sonnet on Bedrock',
      description: 'Ideal for complex marketing reasoning, nuanced causal analysis, and executive summaries.',
      inputModalities: ['Text', 'JSON'],
    },
    {
      modelId: 'amazon.titan-text-premier-v1:0',
      name: 'Amazon Titan Text Premier',
      description: 'Cost-optimized enterprise text model for high-throughput campaign batch scoring.',
      inputModalities: ['Text'],
    },
    {
      modelId: 'amazon.nova-pro-v1:0',
      name: 'Amazon Nova Pro',
      description: 'Next-gen multimodal reasoning for image creative analysis and ad copy evaluation.',
      inputModalities: ['Text', 'Image'],
    },
  ],

  iamPolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'BedrockInvokeModelPolicy',
        Effect: 'Allow',
        Action: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        Resource: [
          'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-*',
          'arn:aws:bedrock:*::foundation-model/amazon.titan-text-*',
          'arn:aws:bedrock:*::foundation-model/amazon.nova-*',
        ],
      },
      {
        Sid: 'DynamoDBCampaignsStore',
        Effect: 'Allow',
        Action: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        Resource: 'arn:aws:dynamodb:*:*:table/CampaignPilot_Campaigns',
      },
      {
        Sid: 'S3ReportsStorage',
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject',
        ],
        Resource: 'arn:aws:s3:::campaignpilot-reports-*/*',
      },
    ],
  },

  backendImplementationSample: `
// AWS SDK v3 Bedrock Client Implementation Sample:
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function diagnoseCampaignWithBedrock(campaignData: any) {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: \`Analyze campaign data: \${JSON.stringify(campaignData)}\`
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await bedrock.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return JSON.parse(result.content[0].text);
}
`,

  dynamoDbSchema: {
    TableName: 'CampaignPilot_Campaigns',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'campaignId', KeyType: 'RANGE' } // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'campaignId', AttributeType: 'S' },
      { AttributeName: 'platform', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PlatformIndex',
        KeySchema: [
          { AttributeName: 'platform', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
};
