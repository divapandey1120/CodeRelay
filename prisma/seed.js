const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const problems = [
  {
    title: "Two Sum",
    difficulty: "EASY",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    sampleInput: "nums = [2,7,11,15], target = 9",
    sampleOutput: "[0,1] (because nums[0] + nums[1] == 9)",
    hints: "Try using a hash map to store the index of each number as you iterate through the array. This allows O(N) time complexity.",
    topicTags: ["Arrays", "Hash Table"],
    isBuiltIn: true
  },
  {
    title: "Valid Parentheses",
    difficulty: "EASY",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
    sampleInput: 's = "()[]{}"',
    sampleOutput: "true",
    hints: "Use a stack data structure. Push opening brackets onto the stack and pop them when you encounter matching closing brackets.",
    topicTags: ["Strings", "Stack"],
    isBuiltIn: true
  },
  {
    title: "Merge Two Sorted Lists",
    difficulty: "EASY",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    sampleInput: "list1 = [1,2,4], list2 = [1,3,4]",
    sampleOutput: "[1,1,2,3,4,4]",
    hints: "Use recursion or a dummy pointer tracker node. Compare the head nodes and link the smaller one next.",
    topicTags: ["Linked List", "Recursion"],
    isBuiltIn: true
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "EASY",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.",
    sampleInput: "prices = [7,1,5,3,6,4]",
    sampleOutput: "5 (buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5)",
    hints: "Track the minimum price seen so far and calculate the potential profit at each day's price.",
    topicTags: ["Arrays", "Dynamic Programming"],
    isBuiltIn: true
  },
  {
    title: "Valid Palindrome",
    difficulty: "EASY",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    sampleInput: 's = "A man, a plan, a canal: Panama"',
    sampleOutput: "true",
    hints: "Use two pointers starting at the beginning and the end, moving towards the middle while ignoring non-alphanumeric characters.",
    topicTags: ["Strings", "Two Pointers"],
    isBuiltIn: true
  },
  {
    title: "Invert Binary Tree",
    difficulty: "EASY",
    description: "Given the root of a binary tree, invert the tree (swap the left and right subtrees for all nodes), and return its root.",
    sampleInput: "root = [4,2,7,1,3,6,9]",
    sampleOutput: "[4,7,2,9,6,3,1]",
    hints: "Try using recursion. Swap the left child and right child of the current node, then recursively invert both children.",
    topicTags: ["Trees", "Binary Tree", "DFS"],
    isBuiltIn: true
  },
  {
    title: "Binary Search",
    difficulty: "EASY",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.",
    sampleInput: "nums = [-1,0,3,5,9,12], target = 9",
    sampleOutput: "4",
    hints: "Initialize low and high pointers. Calculate mid index, check if nums[mid] is target, and narrow search range.",
    topicTags: ["Arrays", "Binary Search"],
    isBuiltIn: true
  },
  {
    title: "Flood Fill",
    difficulty: "EASY",
    description: "An image is represented by an `m x n` integer grid `image` where `image[i][j]` represents the pixel value of the image.\n\nYou are also given three integers `sr`, `sc`, and `color`. You should perform a flood fill on the image starting from the pixel `image[sr][sc]`. To perform a flood fill, consider the starting pixel, plus any pixels connected 4-directionally to the starting pixel of the same color.",
    sampleInput: "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2",
    sampleOutput: "[[2,2,2],[2,2,0],[2,0,1]]",
    hints: "Use DFS or BFS starting from the given cell. Check boundaries and if adjacent cells have the starting cell's original color.",
    topicTags: ["Arrays", "DFS", "BFS"],
    isBuiltIn: true
  },
  {
    title: "Maximum Subarray",
    difficulty: "MEDIUM",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous part of an array.",
    sampleInput: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
    sampleOutput: "6 (because [4,-1,2,1] has the largest sum)",
    hints: "Use Kadane's Algorithm. Keep track of the current maximum sum and overall maximum sum as you iterate.",
    topicTags: ["Arrays", "Dynamic Programming"],
    isBuiltIn: true
  },
  {
    title: "Lowest Common Ancestor of a BST",
    difficulty: "MEDIUM",
    description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes `p` and `q` in the BST.\n\nAccording to the definition of LCA: 'The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants.'",
    sampleInput: "root = [6,2,8,0,4,7,9], p = 2, q = 8",
    sampleOutput: "6",
    hints: "Leverage BST properties. If both p and q are smaller than root, LCA is in the left subtree. If both are larger, it is in the right subtree.",
    topicTags: ["Trees", "Binary Search Tree", "DFS"],
    isBuiltIn: true
  },
  {
    title: "Climbing Stairs",
    difficulty: "EASY",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    sampleInput: "n = 3",
    sampleOutput: "3 (1 step + 1 step + 1 step, 1 step + 2 steps, or 2 steps + 1 step)",
    hints: "This is a Fibonacci sequence problem. The number of ways to reach step n is the sum of ways to reach n-1 and n-2.",
    topicTags: ["Dynamic Programming", "Math"],
    isBuiltIn: true
  },
  {
    title: "Ransom Note",
    difficulty: "EASY",
    description: "Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be constructed by using the letters from `magazine` and `false` otherwise.\n\nEach letter in `magazine` can only be used once in `ransomNote`.",
    sampleInput: 'ransomNote = "a", magazine = "b"',
    sampleOutput: "false",
    hints: "Count frequencies of letters in magazine, then decrement frequencies for letters in ransomNote. Check if any count drops below 0.",
    topicTags: ["Strings", "Hash Table"],
    isBuiltIn: true
  },
  {
    title: "3Sum",
    difficulty: "MEDIUM",
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    sampleInput: "nums = [-1,0,1,2,-1,-4]",
    sampleOutput: "[[-1,-1,2],[-1,0,1]]",
    hints: "Sort the array first. Loop through and use two pointers (left and right) to scan for targets. Skip duplicate values.",
    topicTags: ["Arrays", "Two Pointers", "Sorting"],
    isBuiltIn: true
  },
  {
    title: "Binary Tree Level Order Traversal",
    difficulty: "MEDIUM",
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
    sampleInput: "root = [3,9,20,null,null,15,7]",
    sampleOutput: "[[3],[9,20],[15,7]]",
    hints: "Use a queue for Breadth First Search (BFS). At each level, record the size of the queue to process that level completely.",
    topicTags: ["Trees", "Binary Tree", "BFS"],
    isBuiltIn: true
  },
  {
    title: "Clone Graph",
    difficulty: "MEDIUM",
    description: "Given a reference of a node in a connected undirected graph. Return a deep copy (clone) of the graph.\n\nEach node in the graph contains a value (`int`) and a list of its neighbors (`List[Node]`).",
    sampleInput: "adjList = [[2,4],[1,3],[2,4],[1,3]]",
    sampleOutput: "[[2,4],[1,3],[2,4],[1,3]]",
    hints: "Use DFS or BFS. Keep a hash map to map original nodes to their cloned counterparts to prevent infinite loops.",
    topicTags: ["Graph", "DFS", "BFS"],
    isBuiltIn: true
  },
  {
    title: "Evaluate Reverse Polish Notation",
    difficulty: "MEDIUM",
    description: "You are given an array of strings `tokens` that represents an arithmetic expression in a Reverse Polish Notation.\n\nEvaluate the expression. Return an integer that represents the value of the expression.",
    sampleInput: 'tokens = ["2","1","+","3","*"]',
    sampleOutput: "9 (because ((2 + 1) * 3) = 9)",
    hints: "Use a stack. Loop through tokens: if it is a number, push it. If it is an operator, pop two numbers, apply the operator, and push the result.",
    topicTags: ["Stack", "Math"],
    isBuiltIn: true
  },
  {
    title: "Course Schedule",
    difficulty: "MEDIUM",
    description: "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.",
    sampleInput: "numCourses = 2, prerequisites = [[1,0]]",
    sampleOutput: "true",
    hints: "This is a cycle detection problem in a directed graph. You can use topological sort (Kahn's algorithm) or DFS graph coloring.",
    topicTags: ["Graph", "Topological Sort", "DFS"],
    isBuiltIn: true
  },
  {
    title: "Implement Trie (Prefix Tree)",
    difficulty: "MEDIUM",
    description: "A trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. There are various applications of this data structure, such as autocomplete and spellchecker.\n\nImplement the Trie class with `insert`, `search`, and `startsWith` methods.",
    sampleInput: "Trie operations: insert('apple'), search('apple'), startsWith('app')",
    sampleOutput: "void, true, true",
    hints: "Each node should contain a map or array of children nodes (for 26 letters) and a boolean flag indicating if it is the end of a word.",
    topicTags: ["Design", "Trie", "Hash Table"],
    isBuiltIn: true
  },
  {
    title: "K Closest Points to Origin",
    difficulty: "MEDIUM",
    description: "Given an array of `points` where `points[i] = [xi, yi]` represents a point on the X-Y plane and an integer `k`, return the `k` closest points to the origin `(0, 0)`.\n\nThe distance between two points on the X-Y plane is the Euclidean distance.",
    sampleInput: "points = [[1,3],[-2,2]], k = 1",
    sampleOutput: "[[-2,2]]",
    hints: "You can use a Max Heap of size K, sort the points directly, or use quickselect. Sorting directly has O(N log N) time complexity.",
    topicTags: ["Arrays", "Math", "Heap (Priority Queue)"],
    isBuiltIn: true
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "MEDIUM",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    sampleInput: 's = "abcabcbb"',
    sampleOutput: "3 (the substring 'abc')",
    hints: "Use a sliding window approach with two pointers. Keep track of characters in the current window using a Set or Map.",
    topicTags: ["Strings", "Sliding Window"],
    isBuiltIn: true
  },
  {
    title: "Container With Most Water",
    difficulty: "MEDIUM",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`-th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    sampleInput: "height = [1,8,6,2,5,4,8,3,7]",
    sampleOutput: "49",
    hints: "Use two pointers, one at the start and one at the end. Move the pointer pointing to the shorter line inward.",
    topicTags: ["Arrays", "Two Pointers"],
    isBuiltIn: true
  },
  {
    title: "Word Search",
    difficulty: "MEDIUM",
    description: "Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.",
    sampleInput: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
    sampleOutput: "true",
    hints: "Use backtracking (DFS) starting from every cell matching the first letter of the word. Mark visited cells as you recurse.",
    topicTags: ["Arrays", "Backtracking", "DFS"],
    isBuiltIn: true
  },
  {
    title: "LRU Cache",
    difficulty: "MEDIUM",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class with `get` and `put` operations. Both must run in O(1) average time complexity.",
    sampleInput: "LRUCache cache = new LRUCache(2); cache.put(1, 1); cache.get(1);",
    sampleOutput: "void, 1",
    hints: "Use a hash map for O(1) lookups combined with a doubly linked list to track the order of usage in O(1) time.",
    topicTags: ["Design", "Linked List", "Hash Table"],
    isBuiltIn: true
  },
  {
    title: "Merge Intervals",
    difficulty: "MEDIUM",
    description: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    sampleInput: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
    sampleOutput: "[[1,6],[8,10],[15,18]]",
    hints: "Sort the intervals by their start values. Then, iterate through and merge overlapping intervals with the last merged interval.",
    topicTags: ["Arrays", "Sorting"],
    isBuiltIn: true
  },
  {
    title: "Validate Binary Search Tree",
    difficulty: "MEDIUM",
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys less than the node's key.\n- The right subtree of a node contains only nodes with keys greater than the node's key.\n- Both the left and right subtrees must also be binary search trees.",
    sampleInput: "root = [2,1,3]",
    sampleOutput: "true",
    hints: "Recurse down passing range limits (min, max). For any node, its value must be strictly greater than min and strictly less than max.",
    topicTags: ["Trees", "Binary Tree", "DFS"],
    isBuiltIn: true
  }
];

async function main() {
  console.log("Seeding built-in problems...");
  for (const prob of problems) {
    await prisma.problem.upsert({
      where: { id: `builtin_${prob.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}` },
      update: {
        title: prob.title,
        difficulty: prob.difficulty,
        description: prob.description,
        sampleInput: prob.sampleInput,
        sampleOutput: prob.sampleOutput,
        hints: prob.hints,
        topicTags: prob.topicTags,
        isBuiltIn: true
      },
      create: {
        id: `builtin_${prob.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title: prob.title,
        difficulty: prob.difficulty,
        description: prob.description,
        sampleInput: prob.sampleInput,
        sampleOutput: prob.sampleOutput,
        hints: prob.hints,
        topicTags: prob.topicTags,
        isBuiltIn: true
      }
    });
  }
  console.log("Seeding complete. Preloaded 25 built-in problems.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
