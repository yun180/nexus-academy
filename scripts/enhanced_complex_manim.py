#!/usr/bin/env python3
"""
Enhanced complex mathematical animation video using Manim
Demonstrating exponential/logarithmic functions with explicit formula displays
"""

from manim import *
import os

class EnhancedComplexMathProblem(Scene):
    def construct(self):
        title = Text("指数・対数方程式の解法", font_size=40, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        problem = MathTex(r"2^{x+1} = 8^{x-2}", font_size=32)
        problem.next_to(title, DOWN, buff=0.8)
        self.play(Write(problem))
        self.wait(2)
        
        formula_box = Rectangle(width=7, height=2.5, color=YELLOW, fill_opacity=0.1)
        formula_title = Text("使用する公式:", font_size=24, color=YELLOW, weight=BOLD)
        formula1 = MathTex(r"a^m = a^n \Rightarrow m = n", font_size=20, color=YELLOW)
        formula1_name = Text("(指数が等しい条件)", font_size=16, color=YELLOW)
        formula2 = MathTex(r"(a^m)^n = a^{mn}", font_size=20, color=YELLOW)
        formula2_name = Text("(指数の積の法則)", font_size=16, color=YELLOW)
        
        formula_group = VGroup(formula_box, formula_title, formula1, formula1_name, formula2, formula2_name)
        formula_title.move_to(formula_box.get_top() + DOWN * 0.4)
        formula1.next_to(formula_title, DOWN, buff=0.3)
        formula1_name.next_to(formula1, RIGHT, buff=0.2)
        formula2.next_to(formula1, DOWN, buff=0.2)
        formula2_name.next_to(formula2, RIGHT, buff=0.2)
        formula_group.to_corner(UR, buff=0.3)
        
        self.play(Create(formula_box), Write(formula_title))
        self.play(Write(formula1), Write(formula1_name))
        self.play(Write(formula2), Write(formula2_name))
        self.wait(2)
        
        step1_text = Text("ステップ1: 両辺を同じ底で表現", font_size=26, color=GREEN, weight=BOLD)
        step1_text.next_to(problem, DOWN, buff=0.8)
        self.play(Write(step1_text))
        self.wait(1)
        
        conversion_text = Text("8を2の累乗で表現:", font_size=22, color=ORANGE)
        conversion_text.next_to(step1_text, DOWN, buff=0.4)
        self.play(Write(conversion_text))
        
        conversion = MathTex(r"8 = 2^3", font_size=28, color=ORANGE)
        conversion.next_to(conversion_text, DOWN, buff=0.3)
        self.play(Write(conversion))
        self.wait(2)
        
        rewritten = MathTex(r"2^{x+1} = (2^3)^{x-2}", font_size=30)
        rewritten.next_to(conversion, DOWN, buff=0.6)
        self.play(Write(rewritten))
        self.wait(2)
        
        step2_text = Text("ステップ2: 指数の積の法則を適用", font_size=26, color=GREEN, weight=BOLD)
        step2_text.next_to(rewritten, DOWN, buff=0.6)
        self.play(Write(step2_text))
        
        highlight_box2 = SurroundingRectangle(VGroup(formula2, formula2_name), color=RED, buff=0.1)
        self.play(Create(highlight_box2))
        self.wait(2)
        
        application_text = Text("(a^m)^n = a^{mn} を適用:", font_size=20, color=RED)
        application_text.next_to(step2_text, DOWN, buff=0.3)
        self.play(Write(application_text))
        
        simplified = MathTex(r"2^{x+1} = 2^{3(x-2)}", font_size=30)
        simplified.next_to(application_text, DOWN, buff=0.3)
        self.play(Write(simplified))
        self.wait(1)
        
        expanded = MathTex(r"2^{x+1} = 2^{3x-6}", font_size=30)
        expanded.next_to(simplified, DOWN, buff=0.3)
        self.play(Write(expanded))
        self.wait(2)
        
        self.play(FadeOut(highlight_box2))
        
        step3_text = Text("ステップ3: 底が等しい場合の性質を利用", font_size=26, color=GREEN, weight=BOLD)
        step3_text.next_to(expanded, DOWN, buff=0.6)
        self.play(Write(step3_text))
        
        highlight_box1 = SurroundingRectangle(VGroup(formula1, formula1_name), color=RED, buff=0.1)
        self.play(Create(highlight_box1))
        self.wait(2)
        
        equal_base_text = Text("a^m = a^n ⟹ m = n を適用:", font_size=20, color=RED)
        equal_base_text.next_to(step3_text, DOWN, buff=0.3)
        self.play(Write(equal_base_text))
        
        exponent_eq = MathTex(r"x + 1 = 3x - 6", font_size=30, color=RED)
        exponent_eq.next_to(equal_base_text, DOWN, buff=0.3)
        self.play(Write(exponent_eq))
        self.wait(2)
        
        self.play(FadeOut(highlight_box1))
        
        step4_text = Text("ステップ4: 一次方程式を解く", font_size=26, color=GREEN, weight=BOLD)
        step4_text.next_to(exponent_eq, DOWN, buff=0.6)
        self.play(Write(step4_text))
        self.wait(1)
        
        rearrange_text = Text("項を移項:", font_size=20, color=BLUE)
        rearrange_text.next_to(step4_text, DOWN, buff=0.3)
        self.play(Write(rearrange_text))
        
        rearranged = MathTex(r"x - 3x = -6 - 1", font_size=28)
        rearranged.next_to(rearrange_text, DOWN, buff=0.2)
        self.play(Write(rearranged))
        self.wait(1)
        
        simplified_final = MathTex(r"-2x = -7", font_size=28)
        simplified_final.next_to(rearranged, DOWN, buff=0.2)
        self.play(Write(simplified_final))
        self.wait(1)
        
        divide_text = Text("両辺を-2で割る:", font_size=20, color=BLUE)
        divide_text.next_to(simplified_final, DOWN, buff=0.3)
        self.play(Write(divide_text))
        
        final_answer = MathTex(r"x = \frac{7}{2} = 3.5", font_size=32, color=GOLD)
        final_answer.next_to(divide_text, DOWN, buff=0.3)
        
        answer_box = SurroundingRectangle(final_answer, color=GOLD, buff=0.3)
        answer_decoration = Star(color=GOLD, fill_opacity=0.3).scale(0.3)
        answer_decoration.next_to(answer_box, LEFT, buff=0.2)
        
        self.play(Write(final_answer))
        self.play(Create(answer_box), Create(answer_decoration))
        self.wait(2)
        
        verification_title = Text("検算 (答えの確認):", font_size=24, color=PURPLE, weight=BOLD)
        verification_title.next_to(answer_box, DOWN, buff=0.5)
        self.play(Write(verification_title))
        
        left_calc = Text("左辺: 2^{3.5+1} = 2^{4.5}", font_size=20, color=PURPLE)
        left_calc.next_to(verification_title, DOWN, buff=0.2)
        self.play(Write(left_calc))
        
        right_calc = Text("右辺: 8^{3.5-2} = 8^{1.5} = (2^3)^{1.5} = 2^{4.5}", font_size=20, color=PURPLE)
        right_calc.next_to(left_calc, DOWN, buff=0.1)
        self.play(Write(right_calc))
        
        check_mark = Text("✓ 左辺 = 右辺 なので解は正しい", font_size=20, color=GREEN, weight=BOLD)
        check_mark.next_to(right_calc, DOWN, buff=0.2)
        self.play(Write(check_mark))
        
        celebration = Text("解答完了！", font_size=28, color=GOLD, weight=BOLD)
        celebration.next_to(check_mark, DOWN, buff=0.5)
        self.play(Write(celebration), Flash(celebration))
        
        self.wait(4)

if __name__ == "__main__":
    os.makedirs("/home/ubuntu/nexus-academy/public/videos", exist_ok=True)
    
    scene = EnhancedComplexMathProblem()
    scene.render()
