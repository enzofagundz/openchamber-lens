export type Child = Node | string | null | undefined | false;

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children?: Child | Child[],
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  const list = Array.isArray(children) ? children : children === undefined ? [] : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
};

export const clear = (node: HTMLElement): void => {
  node.replaceChildren();
};

export const button = (label: string, className: string, onClick: () => void): HTMLButtonElement => {
  const node = el('button', className, undefined, label);
  node.type = 'button';
  node.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return node;
};
