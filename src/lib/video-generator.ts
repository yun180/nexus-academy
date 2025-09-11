import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface VideoGenerationRequest {
  problem: string;
  solution: string;
  subject: string;
  responseType: string;
}

export async function generateMathVideo(request: VideoGenerationRequest): Promise<string> {
  const { problem, solution, subject, responseType } = request;
  
  const timestamp = Date.now();
  const videoId = `math_${timestamp}`;
  const scriptPath = `/tmp/${videoId}.py`;
  const outputDir = path.join(process.cwd(), 'public', 'videos');
  
  await fs.mkdir(outputDir, { recursive: true });
  
  const pythonScript = generateManimScript(problem, solution, subject, responseType, videoId);
  
  await fs.writeFile(scriptPath, pythonScript);
  
  try {
    const { stdout, stderr } = await execAsync(
      `cd /tmp && python3 ${scriptPath}`,
      { timeout: 60000 } // 60 second timeout
    );
    
    console.log('Manim output:', stdout);
    if (stderr) console.error('Manim stderr:', stderr);
    
    const generatedVideoPath = `/tmp/media/videos/1080p60/${videoId}.mp4`;
    const finalVideoPath = path.join(outputDir, `${videoId}.mp4`);
    
    await fs.copyFile(generatedVideoPath, finalVideoPath);
    
    await fs.unlink(scriptPath);
    await fs.rm('/tmp/media', { recursive: true, force: true });
    
    return `/videos/${videoId}.mp4`;
  } catch (error) {
    console.error('Video generation error:', error);
    throw new Error('Failed to generate video');
  }
}

function generateManimScript(
  problem: string, 
  solution: string, 
  subject: string, 
  responseType: string,
  videoId: string
): string {
  const steps = parseSolutionSteps(solution);
  
  return `#!/usr/bin/env python3
from manim import *
import os

class ${videoId}(Scene):
    def construct(self):
        # Title based on response type
        title_text = "${getTitle(responseType, subject)}"
        title = Text(title_text, font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        # Problem statement
        problem_text = "${escapePythonString(problem)}"
        problem = Text(problem_text, font_size=32, color=WHITE)
        problem.next_to(title, DOWN, buff=1)
        self.play(Write(problem))
        self.wait(2)
        
        ${generateAnimationSteps(steps)}
        
        # Final pause
        self.wait(3)

if __name__ == "__main__":
    # Create output directory
    os.makedirs("/tmp/media/videos/1080p60", exist_ok=True)
    
    # Render the scene
    scene = ${videoId}()
    scene.render()
`;
}

function parseSolutionSteps(solution: string): string[] {
  const steps = solution.split(/[。.\n]/).filter(step => step.trim().length > 0);
  return steps.map(step => step.trim());
}

function getTitle(responseType: string, subject: string): string {
  const titles: { [key: string]: string } = {
    '解答解説': `${subject}の解答解説`,
    '解法': `${subject}の解法`,
    'ヒント': `${subject}のヒント`,
    '動画解説': `${subject}の動画解説`
  };
  return titles[responseType] || `${subject}の解説`;
}

function escapePythonString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function generateAnimationSteps(steps: string[]): string {
  let animations = '';
  let yPosition = -1;
  
  steps.forEach((step, index) => {
    const stepVar = `step${index}`;
    animations += `
        # Step ${index + 1}
        ${stepVar} = Text("${escapePythonString(step)}", font_size=28, color=GREEN)
        ${stepVar}.shift(DOWN * ${yPosition})
        self.play(Write(${stepVar}))
        self.wait(2)
    `;
    yPosition += 0.8;
  });
  
  return animations;
}
