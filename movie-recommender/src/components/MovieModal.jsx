import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';
import { TMDB_KEY, TMDB_API_BASE } from '../config';
import { LocaleContext } from '../LocaleContext';

export default function MovieModal({ isOpen, onClose, movieId }) {
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    const cancelToken = axios.CancelToken.source();
    axios
      .get(`${TMDB_API_BASE}/movie/${movieId}`, {
        params: { api_key: TMDB_KEY, language: tmdbLang },
        cancelToken: cancelToken.token,
      })
      .then(res => setDetails(res.data))
      .catch(() => {})
      .finally(() => {});
    return () => cancelToken.cancel();
  }, [movieId, tmdbLang]);

  const bg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  if (!details) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bg}>
        <ModalHeader>
          {details.title} ({details.release_date?.slice(0, 4)})
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody color={textColor}>
          <Text mb={4}>{details.overview}</Text>
          <Text fontSize="sm" color="gray.500">
            Компанії:&nbsp;
            {details.production_companies
              ?.map(c => c.name)
              .join(', ') || 'не вказано'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Реліз: {details.release_date}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Закрити</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

