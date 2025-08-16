import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'questionswithpriority.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };

    let questions = records.map(record => ({
      id: record.id,
      category: record.category,
      question: record.question,
      priority: record.Priority ? record.Priority.trim() : ''
    })).filter(q => q.question);

    // Sort by priority
    questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Fisher-Yates shuffle to randomize within priorities
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Limit to 10 questions as in template/app.js
    const limitedQuestions = questions.slice(0, 10).map(q => q.question);

    return NextResponse.json(limitedQuestions);
  } catch (error) {
    console.error('Error fetching or parsing questions:', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
