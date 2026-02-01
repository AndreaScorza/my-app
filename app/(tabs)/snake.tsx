import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, View } from 'react-native';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const BOARD_COLS = 20;
const BOARD_ROWS = 26;
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
  const foodRef = useRef(food); // ✅ add food ref
  const growthRef = useRef(0);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]); // ✅ keep ref in sync

  const resetGame = useCallback(() => {
    setRunning(false);
    setTimeout(() => {
      setSnake(INITIAL_SNAKE);
      setDir(INITIAL_DIR);
      const f = randomFood(INITIAL_SNAKE);
      setFood(f);
      foodRef.current = f; // ✅ keep ref consistent immediately
      setSpeed(BASE_SPEED_MS);
      setScore(0);
      growthRef.current = 0;
      setRunning(true);
    }, 600);
  }, []);

  const step = useCallback(() => {
    setSnake(prev => {
      const currentFood = foodRef.current; // ✅ read latest food
      const nextHead = moveHead(prev[0], dirRef.current);

      const ateFood = nextHead.x === currentFood.x && nextHead.y === currentFood.y;
      const willMoveTail = !ateFood && growthRef.current === 0;

      if (
        nextHead.x < 0 ||
        nextHead.x >= BOARD_COLS ||
        nextHead.y < 0 ||
        nextHead.y >= BOARD_ROWS
      ) {
        resetGame();
        return INITIAL_SNAKE;
      }

      const bodyToCheck = willMoveTail ? prev.slice(0, -1) : prev;
      const hitsSelf = bodyToCheck.some(p => p.x === nextHead.x && p.y === nextHead.y);
      if (hitsSelf) {
        resetGame();
        return INITIAL_SNAKE;
      }

      const newSnake = [nextHead, ...prev];

      if (ateFood) {
        growthRef.current += 1;
        setScore(s => s + 1);

        const newFood = randomFood(newSnake);
        setFood(newFood);
        foodRef.current = newFood; // ✅ keep ref consistent immediately

        setSpeed(ms => Math.max(70, Math.floor(ms * 0.96)));
      }

      if (growthRef.current > 0) {
        growthRef.current -= 1;
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [resetGame]);

  // ✅ interval now depends on `step` too, so it always calls the latest function
  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      step();
    }, speed);
    return () => clearInterval(id);
  }, [speed, step]);

  const changeDir = useCallback((next: Direction) => {
    setDir(curr => {
      if (
        (curr === 'UP' && next === 'DOWN') ||
        (curr === 'DOWN' && next === 'UP') ||
        (curr === 'LEFT' && next === 'RIGHT') ||
        (curr === 'RIGHT' && next === 'LEFT')
      ) return curr;
      return next;
    });
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
      const { dx, dy } = gesture;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 12;
      if (absDx < threshold && absDy < threshold) return;
      if (absDx > absDy) changeDir(dx > 0 ? 'RIGHT' : 'LEFT');
      else changeDir(dy > 0 ? 'DOWN' : 'UP');
    },
  }), [changeDir]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Snake</Text>
      <Text style={styles.subtitle}>Score: {score}</Text>

      <View style={[styles.board, { width: boardWidth, height: boardHeight }]} {...panResponder.panHandlers}>
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

        {Array.from({ length: BOARD_ROWS }).map((_, r) => (
          <View key={`row-${r}`} style={[styles.gridRow, { top: r * cellSize, width: boardWidth }]} />
        ))}
        {Array.from({ length: BOARD_COLS }).map((_, c) => (
          <View key={`col-${c}`} style={[styles.gridCol, { left: c * cellSize, height: boardHeight }]} />
        ))}
      </View>

      <View style={styles.controls}>
        <Text style={{ color: '#888' }}>Swipe on the board to move • Tap below to Pause/Restart</Text>
        <View style={styles.row}>
          <Text onPress={() => setRunning(r => !r)} style={styles.linkBtn}>{running ? 'Pause' : 'Resume'}</Text>
          <Text style={{ color: '#666' }}>  •  </Text>
          <Text onPress={resetGame} style={styles.linkBtn}>Restart</Text>
        </View>
      </View>
    </View>
  );
}

function moveHead(head: Point, dir: Direction): Point {
  switch (dir) {
    case 'UP': return { x: head.x, y: head.y - 1 };
    case 'DOWN': return { x: head.x, y: head.y + 1 };
    case 'LEFT': return { x: head.x - 1, y: head.y };
    case 'RIGHT': return { x: head.x + 1, y: head.y };
    default: return head; // ✅ keeps TS happy if dir is widened
  }
}

function randomFood(occupied: Point[]): Point {
  while (true) {
    const x = Math.floor(Math.random() * BOARD_COLS);
    const y = Math.floor(Math.random() * BOARD_ROWS);
    if (!occupied.some(p => p.x === x && p.y === y)) return { x, y };
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
  linkBtn: {
    color: '#8ab4ff',
    fontWeight: '700',
  },
});
