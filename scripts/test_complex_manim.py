#!/usr/bin/env python3
"""
Test script to create a complex mathematical animation video using Manim
Demonstrating logarithmic and exponential functions
"""

from manim import *
import os

class ComplexMathProblem(Scene):
    def construct(self):
        title = Text("指数・対数方程式の解法", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        problem = MathTex(r"2^{x+1} = 8^{x-2}", font_size=36)
        problem.next_to(title, DOWN, buff=1)
        self.play(Write(problem))
        self.wait(2)
        
        step1_text = Text("両辺を同じ底で表します", font_size=32, color=GREEN)
        step1_text.next_to(problem, DOWN, buff=1)
        self.play(Write(step1_text))
        self.wait(2)
        
        conversion = MathTex(r"8 = 2^3", font_size=32, color=YELLOW)
        conversion.next_to(step1_text, DOWN, buff=0.5)
        self.play(Write(conversion))
        self.wait(2)
        
        rewritten = MathTex(r"2^{x+1} = (2^3)^{x-2}", font_size=36)
        rewritten.next_to(conversion, DOWN, buff=1)
        self.play(Write(rewritten))
        self.wait(2)
        
        step2_text = Text("指数の法則を適用: (a^m)^n = a^{mn}", font_size=28, color=GREEN)
        step2_text.next_to(rewritten, DOWN, buff=1)
        self.play(Write(step2_text))
        self.wait(2)
        
        simplified = MathTex(r"2^{x+1} = 2^{3(x-2)}", font_size=36)
        simplified.next_to(step2_text, DOWN, buff=1)
        self.play(Write(simplified))
        self.wait(2)
        
        expanded = MathTex(r"2^{x+1} = 2^{3x-6}", font_size=36)
        expanded.next_to(simplified, DOWN, buff=0.5)
        self.play(Transform(simplified, expanded))
        self.wait(2)
        
        step3_text = Text("底が等しいので、指数も等しい", font_size=28, color=GREEN)
        step3_text.next_to(expanded, DOWN, buff=1)
        self.play(Write(step3_text))
        self.wait(2)
        
        exponent_eq = MathTex(r"x + 1 = 3x - 6", font_size=36, color=RED)
        exponent_eq.next_to(step3_text, DOWN, buff=1)
        self.play(Write(exponent_eq))
        self.wait(2)
        
        step4_text = Text("xについて解きます", font_size=28, color=GREEN)
        step4_text.next_to(exponent_eq, DOWN, buff=1)
        self.play(Write(step4_text))
        self.wait(1)
        
        rearranged = MathTex(r"1 + 6 = 3x - x", font_size=32)
        rearranged.next_to(step4_text, DOWN, buff=0.5)
        self.play(Write(rearranged))
        self.wait(2)
        
        simplified_final = MathTex(r"7 = 2x", font_size=32)
        simplified_final.next_to(rearranged, DOWN, buff=0.5)
        self.play(Write(simplified_final))
        self.wait(2)
        
        final_answer = MathTex(r"x = \frac{7}{2}", font_size=36, color=GOLD)
        final_answer.next_to(simplified_final, DOWN, buff=1)
        self.play(Write(final_answer))
        self.wait(2)
        
        verification_text = Text("検算: 2^{7/2+1} = 2^{9/2} = 2^{4.5}", font_size=24, color=PURPLE)
        verification_text.next_to(final_answer, DOWN, buff=1)
        self.play(Write(verification_text))
        
        verification_text2 = Text("8^{7/2-2} = 8^{3/2} = (2^3)^{3/2} = 2^{4.5} ✓", font_size=24, color=PURPLE)
        verification_text2.next_to(verification_text, DOWN, buff=0.3)
        self.play(Write(verification_text2))
        self.wait(3)

if __name__ == "__main__":
    os.makedirs("/home/ubuntu/nexus-academy/public/videos", exist_ok=True)
    
    scene = ComplexMathProblem()
    scene.render()
