import { useEffect, useState } from "react";

import { commerceApi } from "@/lib/commerceApi";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    void commerceApi
      .categories()
      .then((items) => {
        if (active) {
          setCategories(
            items.map((item) => ({
              description: item.description,
              id: item.slug,
              name: item.name,
              slug: item.slug,
            })),
          );
        }
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
