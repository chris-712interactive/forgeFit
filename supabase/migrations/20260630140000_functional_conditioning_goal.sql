-- Phase 10A: functional conditioning primary goal (generic mixed-modal / metcon programming).
-- Run alone — PostgreSQL enum add-value rule.

alter type public.fitness_goal add value if not exists 'functional_conditioning';
