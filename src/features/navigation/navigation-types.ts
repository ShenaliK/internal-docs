export interface NavigationItem {
  title: string;
  href: string;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
