import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    border: '1px solid #E5E7EB',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
  },
  problemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  metadata: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  }
});

interface PDFDocumentProps {
  title: string;
  subject: string;
  grade: string;
  unit: string;
  difficulty: string;
  problems: Array<{
    question: string;
    answer: string;
    explanation: string;
  }>;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  title, 
  subject, 
  grade, 
  unit, 
  difficulty, 
  problems 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.metadata}>
        {subject} | {grade} | {unit} | {difficulty}
      </Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>問題</Text>
        {problems.map((problem, index) => (
          <View key={index} style={{ marginBottom: 15 }}>
            <Text style={styles.problemNumber}>問題 {index + 1}</Text>
            <Text style={styles.content}>{problem.question}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>解答</Text>
        {problems.map((problem, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text style={styles.problemNumber}>問題 {index + 1}</Text>
            <Text style={styles.content}>{problem.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>解説</Text>
        {problems.map((problem, index) => (
          <View key={index} style={{ marginBottom: 15 }}>
            <Text style={styles.problemNumber}>問題 {index + 1}</Text>
            <Text style={styles.content}>{problem.explanation}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default PDFDocument;
