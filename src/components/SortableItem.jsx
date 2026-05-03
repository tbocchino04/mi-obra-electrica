import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, MessageSquare, ImageIcon, Pencil, Clock } from "lucide-react";
import { ESTADO_CONFIG, RUBROS } from "../constants/data";

export function SortableItem({ etapaId, item, onToggle, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const cfg  = ESTADO_CONFIG[item.estado];
  const done = item.estado === "completado";
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2.5 py-2.5 px-2.5 rounded-xl mb-1.5 border border-l-2 transition-colors ${cfg.bg} ${cfg.bgDark} ${cfg.border}`}>
      <div {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-ink-300 dark:text-ink-600 flex-shrink-0 touch-none">
        <GripVertical size={15} />
      </div>
      <div onClick={() => onToggle(etapaId, item.id, done)}
        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer border-[1.5px] ${
          done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-600"
        } ${done ? "check-anim" : ""}`}>
        {done && <Check size={11} strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] leading-snug ${done ? "line-through text-ink-400 dark:text-ink-500" : "text-ink dark:text-ink-100"}`}>
          {item.tarea}
        </div>
        {item.ultimoCambio && (
          <div className="flex items-center gap-1 text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">
            <Clock size={9} />
            {item.ultimoCambio.autor === "admin"
              ? "Admin"
              : (RUBROS.find(r => r.id === item.ultimoCambio.rubroId)?.label ?? "Socio")} ·{" "}
            {new Date(item.ultimoCambio.timestamp).toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              day: "2-digit", month: "2-digit",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        )}
        {item.comentario && (
          <div className="flex items-center gap-1 text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
            <MessageSquare size={10} />
            {typeof item.comentario === "string" ? item.comentario : item.comentario.texto}
          </div>
        )}
        {item.foto && (
          <div className="flex items-center gap-1 text-[11px] text-violet-500 mt-0.5">
            <ImageIcon size={10} /> Foto adjunta
          </div>
        )}
      </div>
      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.bgDark}`}>
        {cfg.label}
      </span>
      <button onClick={() => onEdit(etapaId, item)}
        className="bg-transparent border-0 cursor-pointer p-1.5 text-ink-400 dark:text-ink-500 flex-shrink-0 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700">
        <Pencil size={13} />
      </button>
    </div>
  );
}

export function SortableItemList({ etapaId, items, onReorder, onToggle, onEdit }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  );
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    onReorder(etapaId, oldIndex, newIndex);
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} etapaId={etapaId} item={item} onToggle={onToggle} onEdit={onEdit} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
