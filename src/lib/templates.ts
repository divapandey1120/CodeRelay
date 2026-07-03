export const getStarterTemplate = (language: string): string => {
  const normalized = language.toLowerCase();
  switch (normalized) {
    case 'javascript':
      return `// JavaScript Starter Template
function solution() {
    console.log("Hello from JavaScript!");
}
solution();
`;
    case 'typescript':
      return `// TypeScript Starter Template
function solution(): void {
    const greeting: string = "Hello from TypeScript!";
    console.log(greeting);
}
solution();
`;
    case 'python':
      return `# Python Starter Template
def solution():
    print("Hello from Python!")

if __name__ == "__main__":
    solution()
`;
    case 'java':
      return `// Java Starter Template
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
`;
    case 'cpp':
      return `// C++ Starter Template
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
`;
    case 'c':
      return `// C Starter Template
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`;
    case 'go':
      return `// Go Starter Template
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}
`;
    case 'rust':
      return `// Rust Starter Template
fn main() {
    println!("Hello from Rust!");
}
`;
    default:
      return `// Write your collaborative code here
`;
  }
};
