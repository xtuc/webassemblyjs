#include "stdio.h"
#include "stdlib.h"
#include "time.h"
#include "math.h"
#include "float.h"

int main(int argc, char *argv[]) {
	// test id
	int i = atoi(argv[1]);

	/* Intializes random number generator */
	srand(time(NULL) + i);

	double m = rand() / (RAND_MAX / 100.0);

	double r = (double) rand() / (RAND_MAX / exp(m));

	if(rand() > RAND_MAX/2) {
		r = -r;
	}

	printf("%a %.100f\n", r, r);
	return 0;
}
