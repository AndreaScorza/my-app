import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Simple dependency-free Snake implemented with absolute-positioned View blocks
// Works on web and native. Uses on-screen D-pad controls.

type Point = { x: number; y: number };

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const BOARD_COLS = 20;
const BOARD_ROWS = 26; // a bit taller to fit controls below
const INITIAL_SNAKE: Point[] = [
  { x: 5, y: 10 },
  { x: 4, y: 10 },
  { x: 3, y: 10 },
];
const INITIAL_DIR: Direction = 'RIGHT';
const BASE_SPEED_MS = 140;

export default function SnakeScreen() {
  const { width } = Dimensions.get('window');
  const boardSize = Math.min(width - 32, 480);
  const cellSize = useMemo(() => Math.floor(boardSize / BOARD_COLS), [boardSize]);
  const boardWidth = cellSize * BOARD_COLS;
  const boardHeight = cellSize * BOARD_ROWS;

  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [dir, setDir] = useState<Direction>(INITIAL_DIR);
  const [food, setFood] = useState<Point>(() => randomFood(INITIAL_SNAKE));
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED_MS);

  const dirRef = useRef(dir);
  const runningRef = useRef(running);
  const snakeRef = useRef(snake);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);

  // Game loop
  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      step();
    }, speed);
    return () => clearInterval(id);
  }, [speed]);

  const step = useCallback(() => {
    setSnake(prev => {
      const nextHead = moveHead(prev[0], dirRef.current);

      // Collision with walls
      if (
        nextHead.x < 0 ||
        nextHead.x >= BOARD_COLS ||
        nextHead.y < 0 ||
        nextHead.y >= BOARD_ROWS
      ) {
        resetGame();
        return INITIAL_SNAKE;
      }

      // Collision with self
      const hitsSelf = prev.some(p => p.x === nextHead.x && p.y === nextHead.y);
      if (hitsSelf) {
        resetGame();
        return INITIAL_SNAKE;
      }

      const ateFood = nextHead.x === food.x && nextHead.y === food.y;
      const newSnake = [nextHead, ...prev];
      if (!ateFood) {
        newSnake.pop();
      } else {
        setScore(s => s + 1);
        setFood(randomFood(newSnake));
        // Slight speed up, min cap
        setSpeed(ms => Math.max(70, Math.floor(ms * 0.96)));
      }

      return newSnake;
    });
  }, [food]);

  const resetGame = useCallback(() => {
    setRunning(false);
    setTimeout(() => {
      setSnake(INITIAL_SNAKE);
      setDir(INITIAL_DIR);
      setFood(randomFood(INITIAL_SNAKE));
      setSpeed(BASE_SPEED_MS);
      setScore(0);
      setRunning(true);
    }, 600);
  }, []);

  const changeDir = useCallback((next: Direction) => {
    setDir(curr => {
      // prevent direct reverse
      if (
        (curr === 'UP' && next === 'DOWN') ||
        (curr === 'DOWN' && next === 'UP') ||
        (curr === 'LEFT' && next === 'RIGHT') ||
        (curr === 'RIGHT' && next === 'LEFT')
      ) return curr;
      return next;
    });
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Snake</Text>
      <Text style={styles.subtitle}>Score: {score}</Text>

      <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>        
        {/* Food */}
        <View
          style={[
            styles.food,
            {
              width: cellSize,
              height: cellSize,
              left: food.x * cellSize,
              top: food.y * cellSize,
              borderRadius: Math.floor(cellSize / 3),
            },
          ]}
        />

        {/* Snake */}
        {snake.map((seg, idx) => (
          <View
            key={idx}
            style={[
              styles.segment,
              {
                width: cellSize,
                height: cellSize,
                left: seg.x * cellSize,
                top: seg.y * cellSize,
                borderRadius: idx === 0 ? Math.floor(cellSize / 4) : Math.floor(cellSize / 6),
                opacity: idx === 0 ? 1 : 0.9,
              },
            ]}
          />
        ))}

        {/* Grid (light) */}
        {Array.from({ length: BOARD_ROWS }).map((_, r) => (
          <View key={`row-${r}`} style={[styles.gridRow, { top: r * cellSize, width: boardWidth }]} />
        ))}
        {Array.from({ length: BOARD_COLS }).map((_, c) => (
          <View key={`col-${c}`} style={[styles.gridCol, { left: c * cellSize, height: boardHeight }]} />
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>        
        <View style={styles.row}>          
          <TouchableOpacity onPress={() => changeDir('UP')} style={[styles.btn, styles.btnWide]}>
            <Text style={styles.btnText}>▲</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => changeDir('LEFT')} style={styles.btn}>
            <Text style={styles.btnText}>◀</Text>
          </TouchableOpacity>
          <View style={{ width: 24 }} />
          <TouchableOpacity onPress={() => changeDir('RIGHT')} style={styles.btn}>
            <Text style={styles.btnText}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => changeDir('DOWN')} style={[styles.btn, styles.btnWide]}>
            <Text style={styles.btnText}>▼</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setRunning(r => !r)} style={[styles.btnSmall, { backgroundColor: '#444' }]}>            
            <Text style={styles.btnSmallText}>{running ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetGame} style={[styles.btnSmall, { backgroundColor: '#8b0000' }]}>            
            <Text style={styles.btnSmallText}>Restart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function moveHead(head: Point, dir: Direction): Point {
  switch (dir) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
  }
}

function randomFood(occupied: Point[]): Point {
  while (true) {
    const x = Math.floor(Math.random() * BOARD_COLS);
    const y = Math.floor(Math.random() * BOARD_ROWS);
    if (!occupied.some(p => p.x === x && p.y === y)) {
      return { x, y };
    }
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#0b0b0f',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#bbb',
    marginBottom: 12,
  },
  board: {
    backgroundColor: '#0f1220',
    borderWidth: 2,
    borderColor: '#22263d',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    backgroundColor: '#4ade80',
    borderColor: '#1d5e38',
    borderWidth: 1,
  },
  food: {
    position: 'absolute',
    backgroundColor: '#ef4444',
    borderColor: '#7f1d1d',
    borderWidth: 1,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gridCol: {
    position: 'absolute',
    top: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  controls: {
    marginTop: 16,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  btn: {
    width: 72,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1f243b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWide: {
    width: 160,
  },
  btnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  btnSmall: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  btnSmallText: {
    color: '#fff',
    fontWeight: '700',
  },
});
