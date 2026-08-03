"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
  position: "left" | "right";
  jobPosition?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  description?: string;
  className?: string;
  linkTo?: string;
}

export default function TeamMemberCard({
  position = "left",
  jobPosition = "Backend Engineer",
  firstName = "Jennie",
  lastName = "Garcia",
  imageUrl = "https://images.unsplash.com/photo-1526510747491-58f928ec870f?fm=jpg&q=60",
  description = "Jennie is a skilled developer with expertise in modern web technologies and a passion for creating seamless user experiences.",
  className,
  linkTo,
}: TeamMemberCardProps) {
  const navigate = useNavigate();
  const fullName = `${firstName} ${lastName}`;
  const isPositionRight = position === "right";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative my-16 flex flex-col justify-center", className)}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p
          className={cn(
            "mb-4 text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-500",
            isPositionRight && "text-right",
          )}
        >
          {jobPosition}
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center md:justify-end gap-6 md:gap-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative h-[320px] w-[240px] sm:h-[400px] sm:w-[280px] lg:h-[500px] lg:w-[360px] shrink-0 overflow-hidden",
            isPositionRight && "md:order-1",
          )}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <img
            src={imageUrl}
            alt={fullName}
            className="h-full w-full object-cover duration-500 hover:scale-105"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative z-10 flex w-full md:w-[calc(100%-280px)] lg:w-[calc(100%-350px)] flex-col gap-8 md:gap-14 md:-ml-8",
            isPositionRight && "md:ml-0 md:mr-[-2rem] md:items-end",
          )}
        >
          <div>
            <p className="text-4xl sm:text-5xl leading-[1.1] font-extralight tracking-tight text-zinc-900 dark:text-white">
              {firstName}
              <br />
              <span className="font-normal">{lastName}</span>
            </p>
          </div>

          <div className={cn("flex gap-8", isPositionRight && "md:justify-end")}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => linkTo && navigate(linkTo)}
              className={cn(
                "group flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-300 transition-colors duration-300 hover:border-zinc-600 hover:bg-zinc-900 dark:border-white/20 dark:hover:border-white/60 dark:hover:bg-white/10",
                isPositionRight && "md:order-1",
              )}
            >
              <ArrowRight
                size={22}
                className={cn(
                  "text-zinc-600 transition-all duration-300 group-hover:-rotate-45 group-hover:text-white dark:text-zinc-400 dark:group-hover:text-white",
                  isPositionRight && "rotate-180 group-hover:rotate-[225deg]",
                )}
              />
            </motion.div>

            <div className="w-[70%] md:w-[40%]">
              <p
                className={cn(
                  "text-sm leading-[1.8] text-zinc-500 dark:text-zinc-400",
                  isPositionRight && "md:text-right",
                )}
              >
                {description}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
