#!/usr/bin/env python3
"""
Test script to create a sample mathematical animation video using Manim
"""

from manim import *
import os

class MathProblemSolution(Scene):
    def construct(self):
        title = Text("二次方程式の解法", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        problem = MathTex(r"x^2 + 5x + 6 = 0", font_size=36)
        problem.next_to(title, DOWN, buff=1)
        self.play(Write(problem))
        self.wait(2)
        
        step1_text = Text("因数分解を使って解きます", font_size=32, color=GREEN)
        step1_text.next_to(problem, DOWN, buff=1)
        self.play(Write(step1_text))
        self.wait(2)
        
        factored = MathTex(r"(x + 2)(x + 3) = 0", font_size=36)
        factored.next_to(step1_text, DOWN, buff=1)
        self.play(Write(factored))
        self.wait(2)
        
        factor1 = MathTex(r"x + 2 = 0", font_size=32, color=RED)
        factor2 = MathTex(r"x + 3 = 0", font_size=32, color=RED)
        
        factor1.next_to(factored, DOWN, buff=1).shift(LEFT * 2)
        factor2.next_to(factored, DOWN, buff=1).shift(RIGHT * 2)
        
        self.play(Write(factor1), Write(factor2))
        self.wait(2)
        
        solution1 = MathTex(r"x = -2", font_size=32, color=YELLOW)
        solution2 = MathTex(r"x = -3", font_size=32, color=YELLOW)
        
        solution1.next_to(factor1, DOWN, buff=0.5)
        solution2.next_to(factor2, DOWN, buff=0.5)
        
        self.play(Write(solution1), Write(solution2))
        self.wait(2)
        
        final_answer = Text("答え: x = -2, -3", font_size=36, color=GOLD)
        final_answer.next_to(solution1, DOWN, buff=1.5)
        self.play(Write(final_answer))
        self.wait(3)

if __name__ == "__main__":
    os.makedirs("/home/ubuntu/nexus-academy/public/videos", exist_ok=True)
    
    scene = MathProblemSolution()
    scene.render()
