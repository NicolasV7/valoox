export function native(file: File): boolean {
  try {
    return (
      typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] }) === true
    );
  } catch {
    return false;
  }
}

/** Called directly in the click handler, with a File prepared before that tap. */
export function share(file: File): Promise<'opened' | 'cancelled'> {
  try {
    return navigator.share({ files: [file] }).then(
      () => 'opened',
      (error: unknown) => {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
          return 'cancelled';
        throw error;
      },
    );
  } catch (error) {
    return Promise.reject(error);
  }
}

/** The caller releases this object URL on close, logout or the next download. */
export function save(file: File): () => void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const release = () => {
    clearTimeout(timer);
    URL.revokeObjectURL(url);
  };
  try {
    a.href = url;
    a.download = file.name;
    document.body.append(a);
    a.click();
    timer = setTimeout(release, 30000);
    return release;
  } catch (error) {
    release();
    throw error;
  } finally {
    a.remove();
  }
}
