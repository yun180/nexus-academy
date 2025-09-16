import { google } from 'googleapis';
import type { GoogleAuth } from 'google-auth-library';
import { GenerateJobResult } from './queue';

export class GoogleWorkspaceIntegration {
  private auth: GoogleAuth;
  
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/documents'
      ],
    });
  }
  
  async saveToSpreadsheet(result: GenerateJobResult, userId: string): Promise<string> {
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    
    const spreadsheetId = await this.getOrCreateUserSpreadsheet(userId);
    
    const rows = [
      ['Generated Date', 'Subject', 'Grade', 'Unit', 'Difficulty', 'Problem', 'Answer', 'Explanation'],
      ...result.problems.map(problem => [
        new Date().toISOString(),
        result.subject,
        result.grade,
        result.unit,
        result.difficulty,
        problem.question,
        problem.answer,
        problem.explanation
      ])
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Generated Materials!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: rows }
    });
    
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }
  
  async saveToDocument(result: GenerateJobResult, userId: string): Promise<string> {
    const docs = google.docs({ version: 'v1', auth: this.auth });
    
    const doc = await docs.documents.create({
      requestBody: {
        title: `${result.title} - ${new Date().toLocaleDateString()}`
      }
    });
    
    const documentId = doc.data.documentId!;
    
    const content = this.buildDocumentContent(result);
    
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: content
          }
        }]
      }
    });
    
    return `https://docs.google.com/document/d/${documentId}`;
  }
  
  private async getOrCreateUserSpreadsheet(userId: string): Promise<string> {
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    
    try {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `NEXUS ACADEMY - Generated Materials - ${userId}`
          },
          sheets: [{
            properties: {
              title: 'Generated Materials'
            }
          }]
        }
      });
      
      return spreadsheet.data.spreadsheetId!;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }
  
  private buildDocumentContent(result: GenerateJobResult): string {
    let content = `${result.title}\n\n`;
    content += `教科: ${result.subject} | 学年: ${result.grade} | 単元: ${result.unit} | 難易度: ${result.difficulty}\n\n`;
    
    result.problems.forEach((problem, index) => {
      content += `問題 ${index + 1}:\n${problem.question}\n\n`;
      content += `解答 ${index + 1}:\n${problem.answer}\n\n`;
      content += `解説 ${index + 1}:\n${problem.explanation}\n\n`;
      content += '---\n\n';
    });
    
    return content;
  }
}
