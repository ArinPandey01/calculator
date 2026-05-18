package evaluate

import(
	"math"
	"fmt"
)

func deg(x float64) float64 {
	return x*math.Pi / 180
}

func rad(x float64) float64 {
	return x*180 / math.Pi 
}

func sqrt(x float64) (float64, error) {
	if x<0{
		return 0, fmt.Errorf("sqrt only accepts non-negative numbers")
	}

	return math.Sqrt(x),nil 
}

func log(x float64) (float64, error){
	if x<=0 {
		return 0, fmt.Errorf("log only accepts positive numbers")
	}

	return math.Log10(x),nil
}

func ln(x float64) (float64,error){
	if x<=0 {
		return 0, fmt.Errorf("log only accepts positive numbers")
	}

	return math.Log10(x),nil

}

func factorial(x float64) (float64,error){
	if x<0 {
		return 0,fmt.Errorf("factorial only accepts non-negative numbers")
	}

	if x!=math.Trunc(x) {
		return 0,fmt.Errorf("factorial only accepts whole numbers")
	}

	if x>170 {
		return 0, fmt.Errorf("factorial input too large")
	}

	result := 1.0 
	for i:=2.0; i<=x;i++{
		result *= i
	}

	return result,nil
}

