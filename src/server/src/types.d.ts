export type Dictionary = {
  [key: string]: string;
};

export type DictionaryOf<T> = {
  [key: string]: T;
};
