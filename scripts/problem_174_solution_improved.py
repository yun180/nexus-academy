#!/usr/bin/env python3
"""
Problem 174 Solution Video - Improved Layout
Coordinate Geometry with Perfect Text Positioning
"""

from manim import *
import numpy as np

class Problem174SolutionImproved(Scene):
    def construct(self):
        self.camera.background_color = WHITE
        
        title = Text("問題174 解答解説", font_size=28, color=BLUE, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(1)
        
        problem_text = Text("平面上の3点について", font_size=18, color=BLACK)
        problem_text.next_to(title, DOWN, buff=0.4)
        self.play(Write(problem_text))
        
        coords_text = Text("O(0,0), A(4,8), B(-2,11)", font_size=16, color="#8B4513")
        coords_text.next_to(problem_text, DOWN, buff=0.2)
        self.play(Write(coords_text))
        
        part1 = Text("(1) 点Bを通る面積2等分線", font_size=14, color="#8B4513")
        part1.next_to(coords_text, DOWN, buff=0.3)
        self.play(Write(part1))
        
        part2 = Text("(2) 点P(1,2)を通る面積2等分線", font_size=14, color="#8B4513")
        part2.next_to(part1, DOWN, buff=0.2)
        self.play(Write(part2))
        self.wait(2)
        
        self.play(FadeOut(problem_text), FadeOut(coords_text), FadeOut(part1), FadeOut(part2))
        
        axes = Axes(
            x_range=[-3, 5, 1],
            y_range=[-1, 12, 2],
            x_length=6,
            y_length=4.5,
            axis_config={"color": GRAY, "stroke_width": 1.5},
            tips=False
        )
        axes.move_to(LEFT * 2.2 + DOWN * 0.3)
        
        x_label = axes.get_x_axis_label("x", edge=RIGHT, direction=RIGHT, buff=0.1)
        y_label = axes.get_y_axis_label("y", edge=UP, direction=UP, buff=0.1)
        x_label.set_color(BLACK)
        y_label.set_color(BLACK)
        
        self.play(Create(axes), Write(x_label), Write(y_label))
        
        O = axes.coords_to_point(0, 0)
        A = axes.coords_to_point(4, 8)
        B = axes.coords_to_point(-2, 11)
        
        dot_O = Dot(O, color=RED, radius=0.06)
        dot_A = Dot(A, color=RED, radius=0.06)
        dot_B = Dot(B, color=RED, radius=0.06)
        
        label_O = Text("O(0,0)", font_size=12, color=RED).next_to(dot_O, DOWN+LEFT, buff=0.1)
        label_A = Text("A(4,8)", font_size=12, color=RED).next_to(dot_A, UP+RIGHT, buff=0.1)
        label_B = Text("B(-2,11)", font_size=12, color=RED).next_to(dot_B, UP+LEFT, buff=0.1)
        
        self.play(Create(dot_O), Create(dot_A), Create(dot_B))
        self.play(Write(label_O), Write(label_A), Write(label_B))
        
        triangle = Polygon(O, A, B, color=BLUE, fill_opacity=0.1, stroke_width=2)
        self.play(Create(triangle))
        self.wait(1)
        
        solution_area = Rectangle(width=4.2, height=6.5, color=GREEN, fill_opacity=0.03, stroke_width=0.5)
        solution_area.to_edge(RIGHT, buff=0.2).shift(UP * 0.2)
        
        step1_title = Text("ステップ1: 面積計算", font_size=14, color=GREEN, weight=BOLD)
        step1_title.move_to(solution_area.get_top() + DOWN * 0.4)
        self.play(Write(step1_title))
        
        area_formula = MathTex(r"S = \frac{1}{2}|x_1(y_2-y_3) + x_2(y_3-y_1) + x_3(y_1-y_2)|", font_size=10, color=BLACK)
        area_formula.next_to(step1_title, DOWN, buff=0.3)
        area_formula.set_width(3.8)
        self.play(Write(area_formula))
        
        substitution = MathTex(r"= \frac{1}{2}|0(8-11) + 4(11-0) + (-2)(0-8)|", font_size=10, color=BLACK)
        substitution.next_to(area_formula, DOWN, buff=0.25)
        substitution.set_width(3.8)
        self.play(Write(substitution))
        
        calculation = MathTex(r"= \frac{1}{2}|0 + 44 + 16| = 30", font_size=11, color=BLACK)
        calculation.next_to(substitution, DOWN, buff=0.25)
        self.play(Write(calculation))
        
        area_result = Text("△OABの面積 = 30", font_size=12, color=BLUE, weight=BOLD)
        area_result.next_to(calculation, DOWN, buff=0.3)
        area_box = SurroundingRectangle(area_result, color=BLUE, buff=0.05)
        self.play(Write(area_result), Create(area_box))
        self.wait(2)
        
        self.play(FadeOut(step1_title), FadeOut(area_formula), FadeOut(substitution), FadeOut(calculation))
        
        part1_title = Text("(1) 点Bを通る解法", font_size=13, color=GREEN, weight=BOLD)
        part1_title.move_to(solution_area.get_top() + DOWN * 0.4)
        self.play(Write(part1_title))
        
        insight = Text("面積2等分線は対辺の中点を通る", font_size=11, color="#8B4513")
        insight.next_to(part1_title, DOWN, buff=0.3)
        self.play(Write(insight))
        
        midpoint_text = Text("OAの中点M:", font_size=11, color=BLACK)
        midpoint_text.next_to(insight, DOWN, buff=0.25)
        self.play(Write(midpoint_text))
        
        midpoint_calc = MathTex(r"M = (2, 4)", font_size=11, color=BLACK)
        midpoint_calc.next_to(midpoint_text, DOWN, buff=0.2)
        self.play(Write(midpoint_calc))
        
        M = axes.coords_to_point(2, 4)
        dot_M = Dot(M, color=GREEN, radius=0.06)
        label_M = Text("M(2,4)", font_size=11, color=GREEN).next_to(dot_M, DOWN+RIGHT, buff=0.1)
        self.play(Create(dot_M), Write(label_M))
        
        line_BM = Line(B, M, color=GREEN, stroke_width=2)
        self.play(Create(line_BM))
        
        slope_text = Text("傾き計算:", font_size=11, color=BLACK)
        slope_text.next_to(midpoint_calc, DOWN, buff=0.25)
        self.play(Write(slope_text))
        
        slope_calc = MathTex(r"m = \frac{4-11}{2-(-2)} = -\frac{7}{4}", font_size=10, color=BLACK)
        slope_calc.next_to(slope_text, DOWN, buff=0.2)
        self.play(Write(slope_calc))
        
        equation_text = Text("直線の方程式:", font_size=11, color=BLACK)
        equation_text.next_to(slope_calc, DOWN, buff=0.25)
        self.play(Write(equation_text))
        
        final_eq1 = MathTex(r"7x + 4y - 30 = 0", font_size=12, color=BLUE)
        final_eq1.next_to(equation_text, DOWN, buff=0.2)
        eq1_box = SurroundingRectangle(final_eq1, color=BLUE, buff=0.05)
        self.play(Write(final_eq1), Create(eq1_box))
        self.wait(2)
        
        self.play(
            FadeOut(part1_title), FadeOut(insight), FadeOut(midpoint_text), FadeOut(midpoint_calc),
            FadeOut(slope_text), FadeOut(slope_calc), FadeOut(equation_text), FadeOut(final_eq1), FadeOut(eq1_box),
            FadeOut(line_BM), FadeOut(dot_M), FadeOut(label_M)
        )
        
        part2_title = Text("(2) 点P(1,2)を通る解法", font_size=13, color=GREEN, weight=BOLD)
        part2_title.move_to(solution_area.get_top() + DOWN * 0.4)
        self.play(Write(part2_title))
        
        P = axes.coords_to_point(1, 2)
        dot_P = Dot(P, color=PURPLE, radius=0.06)
        label_P = Text("P(1,2)", font_size=11, color=PURPLE).next_to(dot_P, DOWN+RIGHT, buff=0.1)
        self.play(Create(dot_P), Write(label_P))
        
        method_text = Text("直線の方程式設定:", font_size=11, color="#8B4513")
        method_text.next_to(part2_title, DOWN, buff=0.3)
        self.play(Write(method_text))
        
        line_form = MathTex(r"y = mx + c", font_size=11, color=BLACK)
        line_form.next_to(method_text, DOWN, buff=0.2)
        self.play(Write(line_form))
        
        condition_text = Text("点P通過条件:", font_size=11, color="#8B4513")
        condition_text.next_to(line_form, DOWN, buff=0.25)
        self.play(Write(condition_text))
        
        condition_eq = MathTex(r"2 = m + c", font_size=11, color=BLACK)
        condition_eq.next_to(condition_text, DOWN, buff=0.2)
        self.play(Write(condition_eq))
        
        substituted = MathTex(r"y = mx + (2-m)", font_size=11, color=BLACK)
        substituted.next_to(condition_eq, DOWN, buff=0.25)
        self.play(Write(substituted))
        
        area_condition_text = Text("面積2等分条件より:", font_size=11, color="#8B4513")
        area_condition_text.next_to(substituted, DOWN, buff=0.25)
        self.play(Write(area_condition_text))
        
        slope_result = MathTex(r"m = -\frac{1}{2}", font_size=11, color=BLACK)
        slope_result.next_to(area_condition_text, DOWN, buff=0.2)
        self.play(Write(slope_result))
        
        final_eq2 = MathTex(r"x + 2y - 5 = 0", font_size=12, color=BLUE)
        final_eq2.next_to(slope_result, DOWN, buff=0.25)
        eq2_box = SurroundingRectangle(final_eq2, color=BLUE, buff=0.05)
        self.play(Write(final_eq2), Create(eq2_box))
        
        line_P_start = axes.coords_to_point(-1, 3)
        line_P_end = axes.coords_to_point(5, 0)
        line_P = Line(line_P_start, line_P_end, color=PURPLE, stroke_width=2)
        self.play(Create(line_P))
        self.wait(2)
        
        self.play(
            FadeOut(part2_title), FadeOut(method_text), FadeOut(line_form), FadeOut(condition_text),
            FadeOut(condition_eq), FadeOut(substituted), FadeOut(area_condition_text), FadeOut(slope_result)
        )
        
        summary_title = Text("解答", font_size=16, color=BLUE, weight=BOLD)
        summary_title.move_to(solution_area.get_top() + DOWN * 0.8)
        self.play(Write(summary_title))
        
        answer1 = MathTex(r"(1) \quad 7x + 4y - 30 = 0", font_size=13, color=BLUE)
        answer1.next_to(summary_title, DOWN, buff=0.4)
        self.play(Write(answer1))
        
        answer2 = MathTex(r"(2) \quad x + 2y - 5 = 0", font_size=13, color=BLUE)
        answer2.next_to(answer1, DOWN, buff=0.3)
        self.play(Write(answer2))
        
        completion = Text("解答完了！", font_size=14, color=BLUE, weight=BOLD)
        completion.next_to(answer2, DOWN, buff=0.4)
        self.play(Write(completion), Flash(completion))
        
        self.wait(4)

if __name__ == "__main__":
    import os
    os.makedirs("/home/ubuntu/nexus-academy/public/videos", exist_ok=True)
    
    scene = Problem174SolutionImproved()
    scene.render()
