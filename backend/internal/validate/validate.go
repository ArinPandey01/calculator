package validate

import (
	"fmt"
	"strings"
	"unicode"
)

func Validate(expression string) error {
	expression = strings.TrimSpace(expression)

	if expression == "" {
		return fmt.Errorf("expression is required")
	}

	if len(expression) > 500 {
		return fmt.Errorf("expression is too long")
	}

	if strings.Contains(expression, "//") {
		return fmt.Errorf("invalid operator: //")
	}

	if strings.Contains(expression, "**") {
		return fmt.Errorf("invalid operator: **, use pow(x,y)")
	}

	if err := validateCharacters(expression); err != nil {
		return err
	}

	if err := validateParentheses(expression); err != nil {
		return err
	}

	return nil
}

func validateCharacters(expression string) error {
	allowedSymbols := "+-*/%.(),^ "

	for _, ch := range expression {
		if unicode.IsDigit(ch) || unicode.IsLetter(ch) {
			continue
		}

		if strings.ContainsRune(allowedSymbols, ch) {
			continue
		}

		return fmt.Errorf("invalid character: %q", ch)
	}

	return nil
}

func validateParentheses(expression string) error {
	balance := 0

	for _, ch := range expression {
		if ch == '(' {
			balance++
		}

		if ch == ')' {
			balance--
		}

		if balance < 0 {
			return fmt.Errorf("closing parenthesis without opening parenthesis")
		}
	}

	if balance != 0 {
		return fmt.Errorf("unbalanced parentheses")
	}

	return nil
}
