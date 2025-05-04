// src/components/MyList.jsx (Без изменений стилей)
import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HStack, Box } from "@chakra-ui/react";
import MovieCard from "./MovieCard"; // Использует стилизованную карточку

function SortableItem({ movie }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: movie.movieId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* MovieCard уже стилизован */}
      <MovieCard movie={movie} showRating />
    </Box>
  );
}

export default function MyList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myList") || "[]");
    setList(saved);
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = list.findIndex((m) => m.movieId === active.id);
      const newIndex = list.findIndex((m) => m.movieId === over.id);
      const newList = arrayMove(list, oldIndex, newIndex);
      setList(newList);
      localStorage.setItem("myList", JSON.stringify(newList));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}>
      <SortableContext
        items={list.map((m) => m.movieId)}
        strategy={verticalListSortingStrategy}>
        <HStack spacing={4} overflowX="auto" p={4} align="stretch">
          {" "}
          {/* Добавил align="stretch" */}
          {list.map((m) => (
            <SortableItem key={m.movieId} movie={m} />
          ))}
        </HStack>
      </SortableContext>
    </DndContext>
  );
}
