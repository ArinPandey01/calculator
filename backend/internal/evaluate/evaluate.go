package evaluate

import (
	"fmt"
	"math"

	"github.com/expr-lang/expr"
)

var env = map[string]any{
	"sqrt": sqrt,
	"log":  log,
	"ln":   ln,
	"fact": factorial,

	"sin":  math.Sin,
	"cos":  math.Cos,
	"tan":  math.Tan,
	"asin": math.Asin,
	"acos": math.Acos,
	"atan": math.Atan,

	"pow": math.Pow,
	"abs": math.Abs,

	"floor": math.Floor,
	"ceil":  math.Ceil,
	"round": math.Round,

	"deg": deg,
	"rad": rad,

	"pi": math.Pi,
	"e":  math.E,
}

func Evaluate(expression string) (float64, error) {
	program, err := expr.Compile(expression, expr.Env(env))
	if err != nil {
		return 0, err
	}

	output, err := expr.Run(program, env)
	if err != nil {
		return 0, err
	}

	switch value := output.(type) {
	case int:
		return float64(value), nil
	case float64:
		return value, nil
	default:
		return 0, fmt.Errorf("expression did not return a number")
	}
}
