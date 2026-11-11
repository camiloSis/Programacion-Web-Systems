package middlewares

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		inicio := time.Now()
		path := c.Request.URL.Path

		c.Next()

		fmt.Printf("%s | %s %s - %d - %d ms\n",
			time.Now().Format("2006-01-02T15:04:05"),
			c.Request.Method,
			path,
			c.Writer.Status(),
			time.Since(inicio).Milliseconds(),
		)
	}
}
