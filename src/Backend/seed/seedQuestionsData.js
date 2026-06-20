export const SEED_QUESTIONS = [

  // ─── EASY ────────────────────────────────────────────────────────────────

  {
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Map'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6',     output: '[1,2]', explanation: '' },
      { input: 'nums = [3,3], target = 6',        output: '[0,1]', explanation: '' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  \n}`,
      python:     `def two_sum(nums, target):\n    pass`,
      java:       `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    \n}`,
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1',  isHidden: false },
      { input: '3 2 4\n6',     expectedOutput: '1 2',  isHidden: false },
      { input: '3 3\n6',       expectedOutput: '0 1',  isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"',     output: 'true',  explanation: '' },
      { input: 's = "()[]{}"', output: 'true',  explanation: '' },
      { input: 's = "(]"',     output: 'false', explanation: '' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      "s consists of parentheses only: '()[]{}'",
    ],
    starterCode: {
      javascript: `function isValid(s) {\n  \n}`,
      python:     `def is_valid(s):\n    pass`,
      java:       `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
      cpp:        `#include <string>\nusing namespace std;\n\nbool isValid(string s) {\n    \n}`,
    },
    testCases: [
      { input: '()',     expectedOutput: 'true',  isHidden: false },
      { input: '()[]{}', expectedOutput: 'true',  isHidden: false },
      { input: '(]',     expectedOutput: 'false', isHidden: false },
      { input: '([)]',   expectedOutput: 'false', isHidden: true  },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    tags: ['Array', 'Sliding Window'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]',   output: '0', explanation: 'No profit is possible, so return 0.' },
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4',
    ],
    starterCode: {
      javascript: `function maxProfit(prices) {\n  \n}`,
      python:     `def max_profit(prices):\n    pass`,
      java:       `class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    \n}`,
    },
    testCases: [
      { input: '7 1 5 3 6 4', expectedOutput: '5', isHidden: false },
      { input: '7 6 4 3 1',   expectedOutput: '0', isHidden: false },
      { input: '1 2',         expectedOutput: '1', isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Map', 'Sorting'],
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`,
    examples: [
      { input: 'nums = [1,2,3,1]',        output: 'true',  explanation: '1 appears twice.' },
      { input: 'nums = [1,2,3,4]',        output: 'false', explanation: 'All elements are distinct.' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true', explanation: '' },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9',
    ],
    starterCode: {
      javascript: `function containsDuplicate(nums) {\n  \n}`,
      python:     `def contains_duplicate(nums):\n    pass`,
      java:       `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    \n}`,
    },
    testCases: [
      { input: '1 2 3 1',           expectedOutput: 'true',  isHidden: false },
      { input: '1 2 3 4',           expectedOutput: 'false', isHidden: false },
      { input: '1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isHidden: true },
    ],
    source: 'seed',
  },

  {
    title: 'Maximum Subarray',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]',                       output: '1', explanation: '' },
      { input: 'nums = [5,4,-1,7,8]',              output: '23', explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.' },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  \n}`,
      python:     `def max_sub_array(nums):\n    pass`,
      java:       `class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    \n}`,
    },
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6',  isHidden: false },
      { input: '1',                       expectedOutput: '1',  isHidden: false },
      { input: '5 4 -1 7 8',             expectedOutput: '23', isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top: 1+1 and 2.' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: 1+1+1, 1+2, and 2+1.' },
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: {
      javascript: `function climbStairs(n) {\n  \n}`,
      python:     `def climb_stairs(n):\n    pass`,
      java:       `class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}`,
      cpp:        `int climbStairs(int n) {\n    \n}`,
    },
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true  },
    ],
    source: 'seed',
  },

  // ─── MEDIUM ───────────────────────────────────────────────────────────────

  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window', 'Hash Map'],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"',    output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"',   output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  \n}`,
      python:     `def length_of_longest_substring(s):\n    pass`,
      java:       `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}`,
      cpp:        `#include <string>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    \n}`,
    },
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb',    expectedOutput: '1', isHidden: false },
      { input: 'pwwkew',   expectedOutput: '3', isHidden: true  },
      { input: '',         expectedOutput: '0', isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: '3Sum',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'The distinct triplets that sum to zero.' },
      { input: 'nums = [0,1,1]',          output: '[]',                   explanation: 'No triplet sums to zero.' },
      { input: 'nums = [0,0,0]',          output: '[[0,0,0]]',            explanation: '' },
    ],
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5',
    ],
    starterCode: {
      javascript: `function threeSum(nums) {\n  \n}`,
      python:     `def three_sum(nums):\n    pass`,
      java:       `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nvector<vector<int>> threeSum(vector<int>& nums) {\n    \n}`,
    },
    testCases: [
      { input: '-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1', isHidden: false },
      { input: '0 1 1',          expectedOutput: '',                  isHidden: false },
      { input: '0 0 0',          expectedOutput: '0 0 0',             isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'],
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation.`,
    examples: [
      { input: 'nums = [1,2,3,4]',    output: '[24,12,8,6]',    explanation: '' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]',   explanation: '' },
    ],
    constraints: [
      '2 <= nums.length <= 10^5',
      '-30 <= nums[i] <= 30',
      'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
    ],
    starterCode: {
      javascript: `function productExceptSelf(nums) {\n  \n}`,
      python:     `def product_except_self(nums):\n    pass`,
      java:       `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nvector<int> productExceptSelf(vector<int>& nums) {\n    \n}`,
    },
    testCases: [
      { input: '1 2 3 4',      expectedOutput: '24 12 8 6',  isHidden: false },
      { input: '-1 1 0 -3 3',  expectedOutput: '0 0 9 0 0',  isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Container With Most Water',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.`,
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'The vertical lines at indices 1 and 8 form the container with max area = min(8,7) * (8-1) = 49.' },
      { input: 'height = [1,1]',               output: '1',  explanation: '' },
    ],
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4',
    ],
    starterCode: {
      javascript: `function maxArea(height) {\n  \n}`,
      python:     `def max_area(height):\n    pass`,
      java:       `class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    \n}`,
    },
    testCases: [
      { input: '1 8 6 2 5 4 8 3 7', expectedOutput: '49', isHidden: false },
      { input: '1 1',               expectedOutput: '1',  isHidden: false },
      { input: '4 3 2 1 4',         expectedOutput: '16', isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Coin Change',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Array', 'BFS'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3',  explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3',       output: '-1', explanation: '' },
      { input: 'coins = [1], amount = 0',       output: '0',  explanation: '' },
    ],
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4',
    ],
    starterCode: {
      javascript: `function coinChange(coins, amount) {\n  \n}`,
      python:     `def coin_change(coins, amount):\n    pass`,
      java:       `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    \n}`,
    },
    testCases: [
      { input: '1 2 5\n11', expectedOutput: '3',  isHidden: false },
      { input: '2\n3',      expectedOutput: '-1', isHidden: false },
      { input: '1\n0',      expectedOutput: '0',  isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Number of Islands',
    difficulty: 'Medium',
    tags: ['Array', 'Graph', 'BFS', 'DFS', 'Union Find'],
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      {
        input: `grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]`,
        output: '1', explanation: 'All the land cells are connected.'
      },
      {
        input: `grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]`,
        output: '3', explanation: 'Three separate islands.'
      },
    ],
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      "grid[i][j] is '0' or '1'.",
    ],
    starterCode: {
      javascript: `function numIslands(grid) {\n  \n}`,
      python:     `def num_islands(grid):\n    pass`,
      java:       `class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint numIslands(vector<vector<char>>& grid) {\n    \n}`,
    },
    testCases: [
      { input: '1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expectedOutput: '1', isHidden: false },
      { input: '1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expectedOutput: '3', isHidden: false },
    ],
    source: 'seed',
  },

  {
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'Medium',
    tags: ['Array', 'Binary Search'],
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of unique elements, return the minimum element of this array.

You must write an algorithm that runs in \`O(log n)\` time.`,
    examples: [
      { input: 'nums = [3,4,5,1,2]',         output: '1', explanation: 'The original array was [1,2,3,4,5] rotated 3 times.' },
      { input: 'nums = [4,5,6,7,0,1,2]',     output: '0', explanation: '' },
      { input: 'nums = [11,13,15,17]',        output: '11', explanation: 'Not rotated, minimum is the first element.' },
    ],
    constraints: [
      'n == nums.length',
      '1 <= n <= 5000',
      '-5000 <= nums[i] <= 5000',
      'All the integers of nums are unique.',
      'nums is sorted and rotated between 1 and n times.',
    ],
    starterCode: {
      javascript: `function findMin(nums) {\n  \n}`,
      python:     `def find_min(nums):\n    pass`,
      java:       `class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint findMin(vector<int>& nums) {\n    \n}`,
    },
    testCases: [
      { input: '3 4 5 1 2',     expectedOutput: '1',  isHidden: false },
      { input: '4 5 6 7 0 1 2', expectedOutput: '0',  isHidden: false },
      { input: '11 13 15 17',   expectedOutput: '11', isHidden: true  },
    ],
    source: 'seed',
  },

  // ─── HARD ─────────────────────────────────────────────────────────────────

  {
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Stack', 'Dynamic Programming'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The elevation map traps 6 units of rain water.' },
      { input: 'height = [4,2,0,3,2,5]',              output: '9', explanation: '' },
    ],
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    starterCode: {
      javascript: `function trap(height) {\n  \n}`,
      python:     `def trap(height):\n    pass`,
      java:       `class Solution {\n    public int trap(int[] height) {\n        \n    }\n}`,
      cpp:        `#include <vector>\nusing namespace std;\n\nint trap(vector<int>& height) {\n    \n}`,
    },
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isHidden: false },
      { input: '4 2 0 3 2 5',             expectedOutput: '9', isHidden: false },
      { input: '3 0 2 0 4',               expectedOutput: '7', isHidden: true  },
    ],
    source: 'seed',
  },

  {
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    tags: ['Linked List', 'Divide and Conquer', 'Heap', 'Merge Sort'],
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.`,
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'Merging all three lists gives one sorted list.' },
      { input: 'lists = []',                       output: '[]',                explanation: '' },
      { input: 'lists = [[]]',                     output: '[]',                explanation: '' },
    ],
    constraints: [
      'k == lists.length',
      '0 <= k <= 10^4',
      '0 <= lists[i].length <= 500',
      '-10^4 <= lists[i][j] <= 10^4',
      'lists[i] is sorted in ascending order.',
      'The sum of lists[i].length will not exceed 10^4.',
    ],
    starterCode: {
      javascript: `function mergeKLists(lists) {\n  \n}`,
      python:     `def merge_k_lists(lists):\n    pass`,
      java:       `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}`,
      cpp:        `ListNode* mergeKLists(vector<ListNode*>& lists) {\n    \n}`,
    },
    testCases: [
      { input: '1 4 5\n1 3 4\n2 6', expectedOutput: '1 1 2 3 4 4 5 6', isHidden: false },
      { input: '',                   expectedOutput: '',                  isHidden: false },
    ],
    source: 'seed',
  },

  {
    title: 'Word Break',
    difficulty: 'Hard',
    tags: ['String', 'Dynamic Programming', 'Trie', 'Hash Map'],
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

Note that the same word in the dictionary may be reused multiple times in the segmentation.`,
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]',          output: 'true',  explanation: '"leetcode" can be segmented as "leet code".' },
      { input: 's = "applepenapple", wordDict = ["apple","pen"]',     output: 'true',  explanation: '"applepenapple" can be segmented as "apple pen apple".' },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false', explanation: '' },
    ],
    constraints: [
      '1 <= s.length <= 300',
      '1 <= wordDict.length <= 1000',
      '1 <= wordDict[i].length <= 20',
      's and wordDict[i] consist of only lowercase English letters.',
      'All the strings of wordDict are unique.',
    ],
    starterCode: {
      javascript: `function wordBreak(s, wordDict) {\n  \n}`,
      python:     `def word_break(s, word_dict):\n    pass`,
      java:       `class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        \n    }\n}`,
      cpp:        `#include <string>\n#include <vector>\nusing namespace std;\n\nbool wordBreak(string s, vector<string>& wordDict) {\n    \n}`,
    },
    testCases: [
      { input: 'leetcode\nleet code',              expectedOutput: 'true',  isHidden: false },
      { input: 'applepenapple\napple pen',         expectedOutput: 'true',  isHidden: false },
      { input: 'catsandog\ncats dog sand and cat', expectedOutput: 'false', isHidden: true  },
    ],
    source: 'seed',
  },

]
